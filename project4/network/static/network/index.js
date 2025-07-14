document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#following').addEventListener('click', () => load_posts('following'));
  document.querySelector('#feed').addEventListener('click', () => load_posts('feed'));
  document.querySelector('#compose-post').addEventListener('submit', (event) => {
    send_post(event)
  });
  // By default, load the feed
  load_posts('feed');
});

function send_post(event) {
  return false;
}

function load_posts(type) {
  document.querySelector('#profile-view').style.display = 'none';
  document.querySelector('#posts-view').style.display = 'block';
  document.querySelector('#posts-view').innerHTML = ''
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#text').value = '';
  document.querySelector('#imageurl').value = ''
  if (type === 'following') {
    document.querySelector('#header').innerHTML = 'Following';
  }
  else if (type === 'feed') {
    document.querySelector('#header').innerHTML = 'All Posts';
  }
  fetch(`posts/${type}`)
  .then(response => response.json())
  .then(posts => {
    posts.forEach(post => {
      let imageURL = ''
      if (post.imageURL) {
        imageURL = `<img src="${post.imageURL}">`
      }
      console.log(`${imageURL}, ${post.imageURL}`);
      document.querySelector('#posts-view').innerHTML +=
        `
        <div class="post">
          <div class="details">
            <h3><u>${post.author}</u></h3>
            <div>${post.text}</div>
            <div class="footer">
              <div>
                <div class="heart"></div>&nbsp;&nbsp;${post.likers_count}
              </div>
              <div>Posted on: ${post.posted_on}</div>
            </div>
          </div>
          <div class="img">${imageURL}</div>
        </div>
        <hr>
        `
    });
  })
}