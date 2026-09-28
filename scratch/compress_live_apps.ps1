Add-Type -AssemblyName System.Drawing

function Compress-Base64Image {
    param(
        [string]$Base64String,
        [int]$MaxDimension = 760,
        [long]$Quality = 55
    )

    if ([string]::IsNullOrWhiteSpace($Base64String)) {
        return $Base64String
    }

    $rawBase64 = $Base64String
    if ($Base64String -match "^(data:[^;]+;base64,)(.+)$") {
        $rawBase64 = $matches[2]
    }

    try {
        $imageBytes = [Convert]::FromBase64String($rawBase64)
        $msInput = New-Object System.IO.MemoryStream($imageBytes, 0, $imageBytes.Length)
        $origImage = [System.Drawing.Image]::FromStream($msInput)

        $width = $origImage.Width
        $height = $origImage.Height

        if ($width -gt $MaxDimension -or $height -gt $MaxDimension) {
            if ($width -gt $height) {
                $height = [int][Math]::Round($height * ($MaxDimension / $width))
                $width = $MaxDimension
            } else {
                $width = [int][Math]::Round($width * ($MaxDimension / $height))
                $height = $MaxDimension
            }
        }

        $newBitmap = New-Object System.Drawing.Bitmap($width, $height)
        $graphics = [System.Drawing.Graphics]::FromImage($newBitmap)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

        $graphics.DrawImage($origImage, 0, 0, $width, $height)

        $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
        $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $Quality)

        $msOutput = New-Object System.IO.MemoryStream
        $newBitmap.Save($msOutput, $jpegCodec, $encoderParams)
        $compressedBytes = $msOutput.ToArray()

        $graphics.Dispose()
        $newBitmap.Dispose()
        $origImage.Dispose()
        $msInput.Dispose()
        $msOutput.Dispose()

        $origLenKB = [Math]::Round($imageBytes.Length / 1024, 1)
        $compLenKB = [Math]::Round($compressedBytes.Length / 1024, 1)
        Write-Host "    Compressed: ${origLenKB}KB -> ${compLenKB}KB"

        $newBase64 = [Convert]::ToBase64String($compressedBytes)
        return "data:image/jpeg;base64,$newBase64"
    } catch {
        Write-Warning "Failed to compress image: $_"
        return $Base64String
    }
}

$inputPath = Join-Path $PSScriptRoot "backup_live_applications.json"
$outputPath = Join-Path $PSScriptRoot "compressed_live_applications.json"

$jsonContent = [System.IO.File]::ReadAllText($inputPath, [System.Text.Encoding]::UTF8)
$apps = $jsonContent | ConvertFrom-Json

Write-Host "Starting Compression Diet for $($apps.Count) live applications..."

foreach ($app in $apps) {
    Write-Host "Processing [$($app.id)] $($app.store_name)..."

    # 1. image_url 압축
    if (![string]::IsNullOrWhiteSpace($app.image_url)) {
        $imgStr = $app.image_url.Trim()
        if ($imgStr.StartsWith("[")) {
            try {
                $imgArr = $imgStr | ConvertFrom-Json
                $newArr = @()
                foreach ($subImg in $imgArr) {
                    if ($subImg -is [string] -and $subImg.Length -gt 100) {
                        $newArr += (Compress-Base64Image -Base64String $subImg -MaxDimension 760 -Quality 55)
                    } else {
                        $newArr += $subImg
                    }
                }
                $app.image_url = ($newArr | ConvertTo-Json -Compress)
            } catch {
                Write-Warning "Failed to parse image_url array for $($app.id)"
            }
        } elseif ($imgStr.Length -gt 100) {
            $app.image_url = (Compress-Base64Image -Base64String $imgStr -MaxDimension 760 -Quality 55)
        }
    }

    # 2. construction_photos 압축
    if ($null -ne $app.construction_photos) {
        $cpList = $app.construction_photos
        $newCpList = @()
        foreach ($cp in $cpList) {
            if ($cp -is [string] -and $cp.Length -gt 100) {
                $newCpList += (Compress-Base64Image -Base64String $cp -MaxDimension 760 -Quality 55)
            } else {
                $newCpList += $cp
            }
        }
        $app.construction_photos = $newCpList
    }

    # 3. construction_invoice 압축
    if ($null -ne $app.construction_invoice) {
        $ciList = $app.construction_invoice
        $newCiList = @()
        foreach ($ci in $ciList) {
            if ($ci -is [string] -and $ci.Length -gt 100) {
                $newCiList += (Compress-Base64Image -Base64String $ci -MaxDimension 760 -Quality 55)
            } else {
                $newCiList += $ci
            }
        }
        $app.construction_invoice = $newCiList
    }
}

$outputJson = $apps | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($outputPath, $outputJson, [System.Text.Encoding]::UTF8)

$origSize = (Get-Item $inputPath).Length
$dietSize = (Get-Item $outputPath).Length
Write-Host "Completed Diet! Original: $([Math]::Round($origSize/1KB, 1))KB -> Compressed: $([Math]::Round($dietSize/1KB, 1))KB (Reduction: $([Math]::Round((1 - $dietSize/$origSize)*100, 1))%)"
