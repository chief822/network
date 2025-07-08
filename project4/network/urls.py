
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    #API routes
    path("posts", views.new_post, name="new_post"),
    path("posts/<int:id>", views.post, name="update_post"),
    path("posts/<str:type>", views.posts, name="posts"),
    path("profile/<int:id>", views.profile_page, name="profile_page")
]
