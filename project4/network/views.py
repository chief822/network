import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
import re
from . import models
from .models import User

def index(request):
    return render(request, "network/index.html")

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")
    
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))

def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

def posts(request, type):
    if type == "feed":
        posts = models.Posts.objects.all()
    elif type == "following":
        if not request.user.is_authenticated:
            return HttpResponseRedirect(reverse("login"))
        user = request.user
        following = user.following.all()
        posts = models.Posts.objects.filter(author__in=following)
    else:
        return JsonResponse({"error": "invalid posts type"}, status=400)
    
    posts = posts.order_by("-timestamp").all()
    return JsonResponse([post.serialize(viewer=request.user) for post in posts], safe=False)

@csrf_exempt
@login_required
def new_post(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    data = json.loads(request.body)
    imageURL = data.get("imageurl")
    if not is_valid_image_url(imageURL):
        imageURL = None
    post = models.Posts(author=request.user, text=data.get("text"), imageURL=imageURL)
    post.save()
    return JsonResponse({"message": "Posted successfully."}, status=201)

@login_required
def post(request, id):
    try:
        post = models.Posts.objects.get(pk=id)
    except models.Posts.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)
    data = json.loads(request.body)
    if request.method == "POST":
        if request.user != post.author:
            return JsonResponse({"error": "You are not the author of this post."}, status=403)
        post.text = data.get("text")
        imageURL = data.get("imageurl")
        if not is_valid_image_url(imageURL):
            imageURL = None
        post.imageURL = imageURL
        post.save()
        return JsonResponse({"message": "Post edited successfully."}, status=201)
    elif request.method == "PUT":
        like = data.get("like")
        if like:
            post.likers.add(request.user)
            post.save()
            return JsonResponse({"message": "Post liked successfully."}, status=201)
        else:
            post.likers.remove(request.user)
            post.save()
            return JsonResponse({"message": "Post unliked successfully."}, status=201)

    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)

def profile_page(request, id):
    try:
        profile = models.User.objects.get(pk=id)
    except models.User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)
    if request.method == "GET":
        return JsonResponse({
            "name": profile.username,
            "followers": profile.followers_count,
            "following": profile.following_count
        })
    elif request.method == "PUT":
        if request.user == profile:
            return JsonResponse({"error": "can not follow yourself"}, status=403)
        data = json.loads(request.body)
        follow = data.get("follow")
        if follow:
            profile.followers.add(request.user)
            profile.save()
            return JsonResponse({"message": "Followed successfully."}, status=201)
        else:
            profile.followers.remove(request.user)
            profile.save()
            return JsonResponse({"message": "Unfollowed successfully."}, status=201)
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)

def is_valid_image_url(url):
    """
    Validates if a given string is a valid image URL using regex.
    """
    # Regex to match a URL ending with common image extensions
    # It accounts for optional 'www.', various domain characters, path,
    # and common image file extensions (case-insensitive).
    image_url_pattern = re.compile(
        r"^(https?://)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&/=]*)\.(jpg|jpeg|png|gif|bmp)$",
        re.IGNORECASE
    )
    return bool(image_url_pattern.match(url))