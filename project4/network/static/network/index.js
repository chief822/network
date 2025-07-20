let authorid = 0;
document.addEventListener('DOMContentLoaded', function () {
  console.log("here0")
  // Use buttons to toggle between views
  document.querySelector('#following').addEventListener('click', () => load_posts('following'));
  console.log("here01");
  console.log("here02")
  if (document.getElementById("compose-post")) {
    document.querySelector('#compose-post').addEventListener('submit', new_post);
  }
  console.log("here7")
  load_posts('feed');
  // By default, load the feed
  console.log("here");
  console.log("here2");
});

function new_post(event) {
  event.preventDefault();
  let text = document.getElementById('text').value.trim();
  if (text === "") {
    alert("Enter some text");
    return false;
  }
  fetch("/posts", {
    method: "POST",
    body: JSON.stringify({
      text: text
    })
  })
    .then(response => response.json())
    .then(result => {
      if (result["error"]) {
        console.log(`Error: ${result["error"]}`);
        return false;
      }
      load_posts("feed");
      return false;
    })
}

function edit_post(id, text) {
  document.querySelector("#compose-view").style.display = 'block';
  document.querySelector('#profile-view').style.display = 'none';
  document.querySelector('#pag-view').style.display = 'none';
  document.querySelector('#pagination-list').innerHTML = ""
  document.querySelector('#posts-view').style.display = 'none';
  document.querySelector("#footer_line").style.display = 'none';

  document.querySelector('#text').value = `${text}`
  document.querySelector("#post_button").innerHTML = "Save"
  document.querySelector("#compose-post").removeEventListener('submit', new_post);
  document.querySelector("#compose-post").dataset.id=id;
  document.querySelector("#compose-post").addEventListener('submit', submit_edit);
}

function submit_edit(event) {
  event.preventDefault()
  let text = document.getElementById('text').value.trim();
  let id = document.querySelector("#compose-post").dataset.id;
  if (text === "") {
    alert("Enter some text");
    return false;
  }
  document.querySelector("#compose-post").removeEventListener('submit', submit_edit);
  document.querySelector("#compose-post").dataset.id=id;
  document.querySelector("#compose-post").addEventListener('submit', new_post);
  console.log(`${id}, ${text}`)
  fetch(`/posts/${id}`, {
    method: "POST",
    body: JSON.stringify({
      text: text
    })
  })
    .then(response => response.json())
    .then(result => {
      if (result["error"]) {
        console.log(`Error: ${result["error"]}`);
        return false;
      }
      document.querySelector('#compose-post').addEventListener('submit', (event) => {
        new_post(event)
      });
      load_posts("feed");
      return false;
    });
}

function load_posts(type, page_number = 1) {
  if (type === "profile") {
    show_profile(authorid, page_number)
    return;
  }
  if (!isLoggedIn) {
    if (document.getElementById("compose-view")) {
      document.querySelector("#compose-view").style.display = 'none';
    }
    document.querySelector("#follow").style.display = 'none';
  }
  else {
    document.querySelector("#compose-view").style.display = 'block';
    document.querySelector("#follow").style.display = 'block';
  }
  console.log("here3");
  document.querySelector('#profile-view').style.display = 'none';
  document.querySelector('#pag-view').style.display = 'block';
  document.querySelector('#pagination-list').innerHTML = ""
  document.querySelector('#posts-view').style.display = 'block';
  document.querySelector('#posts-view').innerHTML = ""
  document.querySelector("#footer_line").style.display = 'block';
  if (isLoggedIn) {
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#text').value = '';
  }
  if (type === 'following') {
    document.querySelector('#header').innerHTML = 'Following';
  }
  else if (type === 'feed') {
    document.querySelector('#header').innerHTML = 'All Posts';
  }
  document.querySelector("#header_line").style.display = 'block';
  get_posts(type, page_number, document.querySelector("#posts-view"))
    .then(function (max) {
      // render paginator
      paginate(page_number, max, type)
    })

}

function show_profile(id, page_number = 1) {
  authorid = id;
  document.querySelector('#profile-view').style.display = 'block';
  document.querySelector('#pag-view').style.display = 'block';
  document.querySelector('#posts-view').innerHTML = '';
  document.querySelector('#profile-view').innerHTML = '';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#header').innerHTML = "User Profile";
  document.querySelector("#header_line").style.display = 'block';
  document.querySelector("#footer_line").style.display = 'none';
  fetch(`/profile/${id}`)
    .then(response => response.json())
    .then(profile => {
      let button = "Follow"
      if (profile.followed_by_user) {
        button = "Unfollow"
      }
      document.querySelector("#profile-view").innerHTML +=
        `
    <div class="profile">
      <h1 class="big">${profile.name}<button class="btn btn-success" id="follow_button" onclick="follow(${id}, ${profile.followed_by_user})">${button}</button></h1>
      <h2>Followers<br><div class="count">${profile.following}</div></h2>
      <h2>Following<br><div class="count">${profile.followers}</div></h2>
    </div>
    <hr>
    `
      if (isLoggedIn) {
        if (userSignedIn === id) {
          document.getElementById("follow_button").remove()
        }
      }
    })
  get_posts("profile", page_number, document.querySelector("#posts-view"))
    .then(function (max) {
      // render paginator
      paginate(page_number, max, "profile")
    })
}
function follow(id, follows) {
  if (follows) {
    follows = false
  }
  else {
    follows = true
  }
  fetch(`/profile/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      follow: follows
    })
  })
    .then(response => response.json())
    .then(result => {
      if (result["error"]) {
        alert(`${result["error"]}`)
        return
      }
      show_profile(id)
    })
}





function get_posts(type, page_number, element) {

  return fetch(`posts/${type}?page=${page_number}&id=${authorid}`)
    .then(response => response.json())
    .then(data => {
      if (data.posts.length === 0) {
        element.innerHTML = `<h1 id="error">No posts currently.</h1>`;
        return 0;
      }
      if (page_number < 1 || page_number > data.max) {
        element.innerHTML = "Invalid page number";
        return;
      }
      data.posts.forEach(post => {
        if (!post.liked_by_viewer) {
          element.innerHTML +=
            `
        <div class="post">
          <div class="details">
            <div class="footer">
            <h3><u><a onclick="show_profile(${post.author_id})">${post.author}</a></u></h3>
            <button class="btn btn-warning" onclick="edit_post(${post.id}, '${post.text}')">Edit</button>
            </div>
            <div>${post.text}</div>
            <div class="footer">
              <div>
                <div class="heart" data-liked="${post.liked_by_viewer}" onclick="like(this, ${post.id})"></div>&nbsp;&nbsp;<span class="like-count">${post.likers_count}</span>
              </div>
              <div>Posted on: ${post.posted_on}</div>
            </div>
          </div>
        </div>
        <hr>
        `
        }
        else {
          element.innerHTML +=
            `
        <div class="post">
          <div class="details">
            <div class="footer">
            <h3><u><a onclick="show_profile(${post.author_id})">${post.author}</a></u></h3>
            <button class="btn btn-warning" onclick="edit_post(${post.id}, '${post.text}')">Edit</button>
            </div>
            <div>${post.text}</div>
            <div class="footer">
              <div>
                <div class="heart red" data-liked="${post.liked_by_viewer}" onclick="like(this, ${post.id})"></div>&nbsp;&nbsp;<span class="like-count">${post.likers_count}</span>
              </div>
              <div>Posted on: ${post.posted_on}</div>
            </div>
          </div>
        </div>
        <hr>
        `
        }
        if (userSignedIn !== post.author_id) {
          document.querySelectorAll('.btn.btn-warning')[document.querySelectorAll('.btn.btn-warning').length - 1].remove()
        }
      });
      return data.max;
    });
}

function paginate(page_number, max, type) {

  let pag_bar = document.querySelector('#pagination-list');
  if (!pag_bar) {
    return;
  }
  pag_bar.innerHTML = ""
  // render paginator
  if (!pag_bar) {
    return;
  }
  pag_bar.innerHTML = ""
  if (page_number !== 1) {
    pag_bar.innerHTML +=
      `
      <li class="page-item" onclick="load_posts('${type}', ${page_number - 1})">
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
  for (let i = Math.max(Math.min(start - 1, max - 2), 1); i <= Math.min(start + 1, max); ++i) {
    if (i === page_number) {
      pag_bar.innerHTML +=
        `
        <li class="page-item active" aria-current="page" onclick="return false;">
        <a class="page-link" aria-label="Previous">${i}</a>
        </li>
        `
    }
    else {
      pag_bar.innerHTML +=
        `
        <li class="page-item" onclick="load_posts('${type}', ${i})">
        <a class="page-link" aria-label="Previous">${i}</a>
        </li>
        `
    }
  }
  if (page_number !== max && max > 1) {
    pag_bar.innerHTML +=
      `
      <li class="page-item" onclick="load_posts('${type}', ${page_number + 1})">
        <a class="page-link" aria-label="Next">
          <span aria-hidden="true">&raquo;</span>
        </a>
      </li>
      `
  }
}

function like(heartElem, postId) {
  // Read the current like state
  const liked = heartElem.getAttribute("data-liked") === "true";

  // Find the like count element in the same parent
  const likeCountElem = heartElem.parentElement.querySelector(".like-count");

  if (!likeCountElem) {
    console.error("Like count element not found");
    return;
  }

  let count = parseInt(likeCountElem.textContent);


  heartElem.classList.toggle("red")
  // Toggle liked state
  if (liked) {
    heartElem.setAttribute("data-liked", "false");
    count -= 1;
  } else {
    heartElem.setAttribute("data-liked", "true");
    count += 1;
  }

  // Update count
  likeCountElem.textContent = count;

  // Optionally send the update to the server
  fetch(`/posts/${postId}`, { method: "PUT", body: JSON.stringify({ like: !liked }) });
}
