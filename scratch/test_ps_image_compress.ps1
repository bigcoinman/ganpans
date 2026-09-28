Add-Type -AssemblyName System.Drawing

function Compress-Base64Image {
    param(
        [string]$Base64String,
        [int]$MaxDimension = 900,
        [long]$Quality = 72
    )

    # data:image/...;base64, 접두사 분리
    $prefix = ""
    $rawBase64 = $Base64String
    if ($Base64String -match "^(data:[^;]+;base64,)(.+)$") {
        $prefix = $matches[1]
        $rawBase64 = $matches[2]
    }

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

    # JPEG 인코더 및 품질 설정
    $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $Quality)

    $msOutput = New-Object System.IO.MemoryStream
    $newBitmap.Save($msOutput, $jpegCodec, $encoderParams)
    $compressedBytes = $msOutput.ToArray()

    $origSize = $imageBytes.Length
    $compSize = $compressedBytes.Length
    Write-Host "Original: $([Math]::Round($origSize/1024, 1)) KB -> Compressed: $([Math]::Round($compSize/1024, 1)) KB (Reduction: $([Math]::Round((1 - $compSize/$origSize)*100, 1))%)"

    $newBase64 = [Convert]::ToBase64String($compressedBytes)
    $newPrefix = "data:image/jpeg;base64,"

    # 리소스 정리
    $graphics.Dispose()
    $newBitmap.Dispose()
    $origImage.Dispose()
    $msInput.Dispose()
    $msOutput.Dispose()

    return "$newPrefix$newBase64"
}

# 춘천닭갈비(P-260917-001)의 image_url 데이터 1개 테스트
$url = "https://nosobuzwrxxtrgohufsp.supabase.co/rest/v1/applications?id=eq.P-260917-001&select=image_url"
$headers = @{
    "apikey" = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS"
    "Authorization" = "Bearer sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS"
}
$res = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
$imgStr = $res[0].image_url

if ($imgStr.StartsWith("[")) {
    $arr = $imgStr | ConvertFrom-Json
    Write-Host "Found $($arr.Length) images in array"
    foreach ($img in $arr) {
        $comp = Compress-Base64Image -Base64String $img -MaxDimension 900 -Quality 72
    }
} else {
    $comp = Compress-Base64Image -Base64String $imgStr -MaxDimension 900 -Quality 72
}
