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

function load_posts(type, page_number=1) {
  document.querySelector('#profile-view').style.display = 'none';
  document.querySelector('#pag-view').style.display = 'block';
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
  fetch(`posts/${type}?page=${page_number}`)
  .then(response => response.json())
  .then(data => {
    if (page_number < 1 || page_number > data.max) {
      document.querySelector('#posts-view').innerHTML == "Invalid page number"
    }
    data.posts.forEach(post => {
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
    
    // render paginator
    let pag_bar = document.querySelector('#pagination-list');
    pag_bar.innerHTML = ""
    if (page_number !== 1) {
      pag_bar.innerHTML +=
      `
      <li class="page-item" onclick="load_posts('${type}', ${page_number-1})">
        <a class="page-link" aria-label="Previous">
          <span aria-hidden="true">&laquo;</span>
        </a>
      </li>
      `
    }
    let start = page_number;
    if (page_number === 1) {
      start = 2;
    }
    for (let i = start-1; i <= Math.min(start - 1 + 3, data.max); ++i) {
      pag_bar.innerHTML += 
      `
      <li class="page-item" onclick="load_posts('${type}', ${i})"><a class="page-link" aria-label="Previous">${i}</a></li>
      `
    }
    if (page_number !== data.max && data.max !== 1) {
      pag_bar.innerHTML +=
      `
      <li class="page-item" onclick="load_posts('${type}', ${page_number+1})">
        <a class="page-link" aria-label="Next">
          <span aria-hidden="true">&raquo;</span>
        </a>
      </li>
      `
    }
    console.log(`${page_number}, ${data.max}, ${start}`)
  })
}