"""
Discord webhook integration for ManhuaRush.
Sends notifications to Discord when chapters are uploaded with rich embeds.
"""

import json
import sys
from pathlib import Path
from typing import Optional
from datetime import datetime

try:
    from discord import SyncWebhook, Embed, Color
    DISCORD_AVAILABLE = True
except ImportError:
    DISCORD_AVAILABLE = False


def send_chapter_notification(
    webhook_url: str,
    manga_name: str,
    manga_id: str,
    chapter_number: str,
    total_panels: int,
    cover_image_url: str = "",
    read_url: str = "",
    color: int = 3066993,  # Green
    original_size: str = "0 B",
    converted_size: str = "0 B",
) -> dict:
    """
    Send a chapter upload notification to Discord via webhook.

    Args:
        webhook_url: Discord webhook URL
        manga_name: Name of the manga/series
        manga_id: Manga ID (MangaDex ID)
        chapter_number: Chapter number being uploaded
        total_panels: Total number of panels/images in the chapter
        cover_image_url: URL to chapter cover image (optional)
        read_url: URL to read the chapter (optional)
        status: Upload status message
        color: Embed color (decimal format, default green)
        original_size: Original file size before conversion
        converted_size: File size after conversion to AVIF

    Returns:
        dict with success status and response details
    """
    if not webhook_url:
        return {"success": False, "error": "Webhook URL not provided"}
    
    if not DISCORD_AVAILABLE:
        return {"success": False, "error": "discord.py not installed"}

    try:
        # Get webhook from URL
        webhook = SyncWebhook.from_url(webhook_url)
        
        # Create embed using discord.py
        embed = Embed(
            title=f"📖 {manga_name}",
            description=f"**Chapter {chapter_number}** is now Live!",
            color=Color(0x8B00FF),  # Purple
            timestamp=datetime.utcnow()
        )
        
        # Add fields
        embed.add_field(name="📂 Panels", value=str(total_panels), inline=False)
        embed.add_field(name="ℹ️ Manga ID", value=f"`{manga_id}`", inline=False)
        
        # Add read link if provided
        if read_url:
            embed.add_field(name="📖 Read Now", value=f"[Click here to read]({read_url})", inline=False)
        
        # Add thumbnail if provided
        if cover_image_url and cover_image_url.strip():
            embed.set_image(url=cover_image_url)
        
        # Set footer
        embed.set_footer(text="ManhuaRush")
        
        # Send webhook
        message = webhook.send(embed=embed, username="Lokey")
        
        return {
            "success": True,
            "message": "Notification sent successfully",
            "message_id": message.id if message else "sent",
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


def send_batch_notification(
    webhook_url: str,
    batch_title: str,
    chapters_uploaded: list,
    total_files: int,
    duration: float,
) -> dict:
    """
    Send a batch upload completion notification.

    Args:
        webhook_url: Discord webhook URL
        batch_title: Title for the batch (e.g., series name)
        chapters_uploaded: List of chapter info dicts
        total_files: Total files processed
        duration: Time elapsed

    Returns:
        dict with success status
    """
    if not webhook_url:
        return {"success": False, "error": "Webhook URL not provided"}
    
    if not DISCORD_AVAILABLE:
        return {"success": False, "error": "discord.py not installed"}

    try:
        webhook = SyncWebhook.from_url(webhook_url)
        
        # Build chapter list
        chapters_text = "\n".join([
            f"• Ch. {ch['chapter']}: {ch['panels']} panels"
            for ch in chapters_uploaded[:10]  # Limit to 10
        ])

        if len(chapters_uploaded) > 10:
            chapters_text += f"\n• ... and {len(chapters_uploaded) - 10} more"

        # Create embed
        embed = Embed(
            title=f"✅ Batch Upload Complete: {batch_title}",
            color=Color(0x8B00FF),  # Purple
            timestamp=datetime.utcnow()
        )
        
        embed.add_field(name="📚 Chapters Uploaded", value=chapters_text, inline=False)
        embed.add_field(
            name="📊 Statistics",
            value=f"**Files:** {total_files}\n**Time:** {duration:.1f}s",
            inline=False
        )
        
        embed.set_footer(text="ManhuaRush Upload System")
        
        # Send webhook
        message = webhook.send(embed=embed, username="Lokey")
        
        return {
            "success": True,
            "message": "Batch notification sent successfully",
            "message_id": message.id if message else "sent",
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


def send_error_notification(
    webhook_url: str,
    manga_name: str,
    chapter_number: str,
    error_message: str,
    manga_id: str = "",
) -> dict:
    """
    Send an error notification to Discord.

    Args:
        webhook_url: Discord webhook URL
        manga_name: Name of the manga
        chapter_number: Chapter being processed
        error_message: Error description
        manga_id: Manga ID (optional)

    Returns:
        dict with success status
    """
    if not webhook_url:
        return {"success": False, "error": "Webhook URL not provided"}
    
    if not DISCORD_AVAILABLE:
        return {"success": False, "error": "discord.py not installed"}

    try:
        webhook = SyncWebhook.from_url(webhook_url)
        
        # Create embed
        embed = Embed(
            title=f"⚠️ Upload Error: {manga_name}",
            description=f"**Chapter {chapter_number}** failed to upload",
            color=Color(0xFF0000),  # Red
            timestamp=datetime.utcnow()
        )
        
        if manga_id:
            embed.add_field(name="Manga ID", value=f"`{manga_id}`", inline=True)
        
        embed.add_field(name="❌ Error", value=f"```\n{error_message[:500]}\n```", inline=False)
        embed.set_footer(text="ManhuaRush Upload System")
        
        # Send webhook
        message = webhook.send(embed=embed, username="Lokey")
        
        return {
            "success": True,
            "message": "Error notification sent",
            "message_id": message.id if message else "sent",
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }
