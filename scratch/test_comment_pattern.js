const fs = require('fs');

const cfg = fs.readFileSync('supabase-config.js', 'utf8');
const url = cfg.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/)[1];
const key = cfg.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/)[1];

async function testPattern() {
    // 1. Insert a test review
    const res1 = await fetch(`${url}/rest/v1/reviews`, {
        method: 'POST',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            author_id: null,
            author_name: '홍길동 사장님',
            shop_name: '수원시 · 테스트식당',
            content: '후기 본문입니다',
            rating: 5
        })
    });
    const review = (await res1.json())[0];
    console.log('Created review:', review.id);

    // 2. Insert a comment on this review
    const res2 = await fetch(`${url}/rest/v1/reviews`, {
        method: 'POST',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            author_id: null,
            author_name: '답글작성자',
            shop_name: `COMMENT:${review.id}`,
            content: '후기 잘 보았습니다 축하드립니다!',
            rating: 0
        })
    });
    const comment = (await res2.json())[0];
    console.log('Created comment:', comment.id, 'for review:', comment.shop_name);

    // 3. Query all reviews and comments
    const res3 = await fetch(`${url}/rest/v1/reviews?select=*`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const all = await res3.json();
    console.log('Total rows in reviews table:', all.length);

    // Separate main reviews and comments
    const mainReviews = all.filter(r => !r.shop_name.startsWith('COMMENT:'));
    const comments = all.filter(r => r.shop_name.startsWith('COMMENT:'));
    console.log('Main reviews count:', mainReviews.length);
    console.log('Comments count:', comments.length);

    // 4. Delete comment
    const delComment = await fetch(`${url}/rest/v1/reviews?id=eq.${comment.id}`, {
        method: 'DELETE',
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    console.log('Delete comment status:', delComment.status);

    // 5. Delete review
    const delReview = await fetch(`${url}/rest/v1/reviews?id=eq.${review.id}`, {
        method: 'DELETE',
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    console.log('Delete review status:', delReview.status);
}

testPattern();
