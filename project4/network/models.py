from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    followers = models.ManyToManyField(
        "self",
        symmetrical=False,
        related_name="following",
        blank=True
    )
    def followers_count(self):
        return self.followers.count()
    def following_count(self):
        return self.following.count()
    

class Posts(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="post")
    text = models.TextField()
    imageURL = models.URLField(blank=True)
    timestamp = models.DateTimeField()
    posted_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)
    likers = models.ManyToManyField(User, related_name="liked_posts", blank=True)
    def serialize(self, *, viewer=None):
        """
        viewer (User | None) lets you check if *this* user already liked it.
        """
        return {
            "id": self.id,
            "author": self.author.username,
            "text": self.text,
            "imageURL": self.image_url,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "likers_count": self.likers.count(),
            "liked_by_viewer": (viewer is not None and self.likers.filter(pk=viewer.pk).exists())
        }
