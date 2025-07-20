import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator
from django.core.exceptions import ObjectDoesNotExist
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
    elif type == "profile":
        id = request.GET.get("id", 0) # 0  cuz no user can have id with 0
        try:
            profile = models.User.objects.get(id=id)
        except User.DoesNotExist:
            return JsonResponse({"error": "user doesnt exist", "id": id}, status=400)
        posts = profile.posts.all()
    else:
        return JsonResponse({"error": "invalid posts type"}, status=400)
    
    posts = posts.order_by("-posted_on").all()
    pages = Paginator(posts, 10)
    page_number = request.GET.get('page')
    page = pages.get_page(page_number)
    posts = [post.serialize(viewer=request.user) for post in page]
    data = {
        "posts": posts,
        "max": pages.num_pages
    }
    return JsonResponse(data)

@csrf_exempt
@login_required
def new_post(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    data = json.loads(request.body)
    if not data.get("text"):
        return JsonResponse({"error": "Enter some text."}, status=400)
    post = models.Posts(author=request.user, text=data.get("text"))
    post.save()
    return JsonResponse({"message": "Posted successfully."}, status=201)

@login_required
@csrf_exempt
def post(request, id):
    print("herepost")
    try:
        post = models.Posts.objects.get(pk=id)
    except models.Posts.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)
    print("here2post")
    print(request.body)
    data = json.loads(request.body)
    print("herepost")
    if request.method == "POST":
        print("in here post")
        if request.user != post.author: # securtiy
            return JsonResponse({"error": "You are not the author of this post."}, status=403)
        post.text = data.get("text")
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

@csrf_exempt
def profile_page(request, id):
    try:
        profile = models.User.objects.get(pk=id)
    except models.User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)
    if request.method == "GET":
        return JsonResponse({
            "name": profile.username,
            "followers": profile.followers_count(),
            "following": profile.following_count(),
            "followed_by_user": profile.followers.filter(id=request.user.id).exists()
        })
    elif request.method == "PUT":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "You need to log in to follow"}, status=403)
        if request.user == profile:
            print("forbidden")
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