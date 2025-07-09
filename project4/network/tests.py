from django.test import TestCase
from . import models

# Create your tests here.
class TestAPIs(TestCase):
    def setUp(self):
        self.brian = models.User.objects.create_user(
            username="brian", password="somepassword"
        )
        self.david = models.User.objects.create_user(
            username="david", password="somepassword"
        )
        self.alex = models.User.objects.create_user(
            username="alex",  password="somepassword"
        )
        # Create post
        self.post = models.Posts.objects.create(
            author=self.brian,
            text="Hello world!",
            imageURL="https://example.com/image.jpg"
        )

        # Add david as a liker
        self.post.likers.add(self.david)


    def test_follow(self):
        self.brian.followers.add(self.david)
        self.brian.followers.add(self.alex)
        self.assertEqual(self.brian.followers_count(), 2)
        self.assertEqual(self.brian.following_count(), 0)
        self.assertEqual(self.david.following_count(), 1)
        self.assertEqual(self.alex.following_count(), 0)
        self.assertTrue(models.User.objects.filter(username="brian", followers=self.david).exists())

    def test_post_serialize_with_viewer(self):
        data = self.post.serialize(viewer=self.david)

        self.assertEqual(data["author"], "brian")
        self.assertEqual(data["text"], "Hello world!")
        self.assertEqual(data["imageURL"], self.post.image_url)
        self.assertEqual(data["likers_count"], 1)
        self.assertTrue(data["liked_by_viewer"])

    def test_post_serialize_without_viewer(self):
        data = self.post.serialize()

        self.assertEqual(data["likers_count"], 1)
        self.assertFalse(data["liked_by_viewer"])