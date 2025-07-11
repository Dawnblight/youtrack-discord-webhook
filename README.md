# Enhanced YouTrack Discord Webhook

A comprehensive Discord webhook integration for JetBrains YouTrack with rich formatting, emojis, and extensive event
tracking.

## Features

### 📊 Event Notifications

- **🆕 New issue creation** - Rich embeds with full issue details
- **✅ Issue resolution** - With resolution timestamps
- **⚠️ Priority changes** - Dynamic emoji indicators
- **🔄 Status/Stage changes** - Clear before/after transitions
- **👤 Assignee changes** - User information with links
- **📋 Type changes** - Visual type indicators
- **🎯 Category changes** - Project-specific categorization
- **💬 Comments** - Formatted comment notifications

### 🎨 Visual Enhancements

- **Dynamic colors** - Embeds change color based on priority/type
- **Smart emojis** - Context-aware emoji selection
- **Rich formatting** - Markdown support with organized layouts
- **Timestamps** - Discord-native time formatting
- **Thumbnails** - Branded issue cards
- **Author links** - Direct links to user profiles

### 🔧 Customization

- **Priority mapping** - Supports custom priority levels (Minor, Normal, Major, Critical, Show-stopper)
- **Type support** - Bug, Feature, Task, Epic, Improvement, User Story
- **Category system** - Game development categories (Gameplay, UI, Art, etc.)
- **Color coding** - Configurable embed colors
- **Emoji customization** - Easy emoji modification

## Setup

### 1. Create Discord Webhook

1. Go to your Discord server settings
2. Navigate to **Integrations** → **Webhooks**
3. Click **Create Webhook**
4. Copy the webhook URL

### 2. Setup YouTrack Workflow

1. In YouTrack, go to **Administration** → **Workflows**
2. Click **New workflow** → **JavaScript Editor**
3. Name it `discord-webhook`
4. Create 3 custom modules:

#### Module 1: config.js

Copy the contents from `config.js.example` and update:

- Replace `YOUR_DISCORD_WEBHOOK_URL_HERE` with your actual webhook URL
- Update `YOUTRACK_URL` with your YouTrack instance URL
- Customize `SITE_NAME` and other branding

#### Module 2: payload.js

Copy the contents from `payload.js` exactly as provided.

#### Module 3: main.js

Copy the contents from `main.js` exactly as provided.

### 3. Attach Workflow

1. Go to your **YouTrack page** → **Administration** → **Workflows**
2. In **Workflows** → **Select User-created on the top right** → **Click your `discord-webhook`** → **Projects** → **Manage Projects** → **Check the project you want to attach it to**

## Configuration

### Priority Levels

The webhook supports these priority levels with corresponding emojis:

- 🟢 **Minor** - Green
- 🔵 **Normal** - Blue
- 🟠 **Major** - Orange
- 🔴 **Critical** - Red
- 🚨 **Show-stopper** - Emergency

### Issue Types

Supported issue types with visual indicators:

- 🐛 **Bug** - Red embeds
- ⭐ **Feature** - Green embeds
- 📋 **Task** - Blue embeds
- 🎯 **Epic** - Purple embeds
- 🔧 **Improvement** - Orange embeds
- 👥 **User Story** - Dodger blue embeds

### Categories

Game development categories with emojis:

- 🎮 **Gameplay Mechanics**
- 📖 **Story & Narrative**
- 🖥️ **User Interface**
- ⚙️ **Performance & Technical**
- 🎨 **Art & Visual**
- 🎵 **Audio & Music**
- 🌍 **Worldbuilding**
- 📝 **Other**

## Notification Examples

### New Issue

```
🆕 New Bug: BUG-123
🐛 Login system crashes on mobile

> The login form doesn't work properly on iOS devices...

• Type: 🐛 Bug
• Priority: 🔴 Critical
• Category: 🖥️ User Interface
• Status: Open
• Assignee: 👤 John Doe
```

### Priority Change

```
⚠️ Priority Changed: BUG-123
🔄 Login system crashes on mobile

• Priority: Normal → 🔴 Critical
```

### Resolution

```
✅ Issue Resolved: BUG-123
✅ Login system crashes on mobile

> ✅ This issue has been successfully resolved!

• Final Status: Fixed
• Resolution Time: 18 minutes ago
```

## Troubleshooting

### No Notifications

1. Check that the workflow is attached to your project
2. Verify your Discord webhook URL is correct
3. Test the webhook URL with a simple curl command
4. Check YouTrack workflow logs for errors

### Rate Limiting

Discord webhooks are limited to:

- 30 messages per minute per channel
- Shared limit across all webhook senders

### Custom Fields

If your YouTrack uses different field names:

- Update field references in `main.js` (e.g., `issue.isChanged("YourFieldName")`)
- Modify emoji mappings or avatar thumbnails in `config.js` to match your values

## Credits

Based on the original [youtrack-discord-webhook](https://github.com/TomDotBat/youtrack-discord-webhook) by TomDotBat,
enhanced with:

- Expanded event coverage
- Rich visual formatting
- Custom priority/type/category support
- Improved reliability and error handling

## License

MIT License - Feel free to modify and use for your projects!