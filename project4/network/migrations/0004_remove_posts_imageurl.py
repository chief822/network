# Generated by Django 4.2.23 on 2025-07-16 09:00

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("network", "0003_alter_posts_imageurl"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="posts",
            name="imageURL",
        ),
    ]
