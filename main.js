const entities = require("@jetbrains/youtrack-scripting-api/entities");
const CONFIG = require("./config");
const {Payload} = require("./payload");

function getPriorityEmoji(priority) {
    if (!priority) return CONFIG.EMOJIS.NORMAL;
    const name = priority.name.toLowerCase();
    if (name.includes('show-stopper') || name.includes('showstopper')) return CONFIG.EMOJIS.SHOWSTOPPER;
    if (name.includes('critical')) return CONFIG.EMOJIS.CRITICAL;
    if (name.includes('major')) return CONFIG.EMOJIS.MAJOR;
    if (name.includes('normal')) return CONFIG.EMOJIS.NORMAL;
    if (name.includes('minor')) return CONFIG.EMOJIS.MINOR;
    return CONFIG.EMOJIS.NORMAL;
}

function getTypeEmoji(type) {
    if (!type) return CONFIG.EMOJIS.TASK;
    const name = type.name.toLowerCase();
    if (name.includes('bug')) return CONFIG.EMOJIS.BUG;
    if (name.includes('feature')) return CONFIG.EMOJIS.FEATURE;
    if (name.includes('epic')) return CONFIG.EMOJIS.EPIC;
    if (name.includes('improvement')) return CONFIG.EMOJIS.IMPROVEMENT;
    if (name.includes('user story')) return CONFIG.EMOJIS.USER_STORY;
    if (name.includes('task')) return CONFIG.EMOJIS.TASK;
    return CONFIG.EMOJIS.TASK;
}

function getCategoryEmoji(category) {
    if (!category) return CONFIG.EMOJIS.OTHER;
    const name = category.name.toLowerCase();
    if (name.includes('gameplay') && name.includes('mechanic')) return CONFIG.EMOJIS.GAMEPLAY_MECHANICS;
    if (name.includes('story') && name.includes('narrative')) return CONFIG.EMOJIS.STORY_NARRATIVE;
    if (name.includes('user') && name.includes('interface')) return CONFIG.EMOJIS.USER_INTERFACE;
    if (name.includes('performance') && name.includes('technical')) return CONFIG.EMOJIS.PERFORMANCE_TECHNICAL;
    if (name.includes('art') && name.includes('visual')) return CONFIG.EMOJIS.ART_VISUAL;
    if (name.includes('audio') && name.includes('music')) return CONFIG.EMOJIS.AUDIO_MUSIC;
    if (name.includes('worldbuilding')) return CONFIG.EMOJIS.WORLDBUILDING;
    return CONFIG.EMOJIS.OTHER;
}

function getEmbedColor(issue, defaultColor) {
    if (issue.Priority && CONFIG.PRIORITY_COLORS[issue.Priority.name]) {
        return CONFIG.PRIORITY_COLORS[issue.Priority.name];
    }
    if (issue.Type && CONFIG.TYPE_COLORS[issue.Type.name]) {
        return CONFIG.TYPE_COLORS[issue.Type.name];
    }
    return defaultColor;
}

// Helper function to create manual Discord embed
function createDiscordEmbed(title, description, color, url, author, fields, footer, thumbnail) {
    const embed = {
        title: title,
        description: description,
        color: color,
        url: url,
        timestamp: new Date().toISOString()
    };

    if (author) {
        embed.author = {
            name: author.name,
            url: author.url,
            icon_url: author.icon_url
        };
    }

    if (fields && fields.length > 0) {
        embed.fields = fields;
    }

    if (footer) {
        embed.footer = {
            text: footer
        };
    }

    if (thumbnail) {
        embed.thumbnail = {
            url: thumbnail
        };
    }

    return embed;
}

exports.rule = entities.Issue.onChange({
    title: "Discord Webhook - Manual Embeds",
    guard: (ctx) => {
        return ctx.issue.isReported;
    },
    action: (ctx) => {
        const issue = ctx.issue;
        const user = ctx.currentUser;

        // NEW ISSUE CREATED
        if (issue.becomesReported) {
            const typeEmoji = getTypeEmoji(issue.Type);
            const priorityEmoji = getPriorityEmoji(issue.Priority);

            const title = `${CONFIG.EMOJIS.NEW_ISSUE} New ${issue.Type ? issue.Type.name : 'Issue'}: ${issue.id}`;

            let description = `${typeEmoji} **${issue.summary}**\n\n`;

            if (issue.description) {
                let desc = issue.description;
                if (desc.length > 200) {
                    desc = desc.substring(0, 200) + "...";
                }
                description += `> ${desc}\n\n`;
            }

            description += `${CONFIG.VISUAL_ELEMENTS.DOT} **Priority:** ${priorityEmoji} ${issue.Priority ? issue.Priority.name : 'Unset'}\n`;
            description += `${CONFIG.VISUAL_ELEMENTS.DOT} **Status:** ${issue.State ? issue.State.name : 'Open'}\n`;
            if (issue.Assignee) {
                description += `${CONFIG.VISUAL_ELEMENTS.DOT} **Assignee:** ${CONFIG.EMOJIS.ASSIGNED} ${issue.Assignee.visibleName}`;
            } else {
                description += `${CONFIG.VISUAL_ELEMENTS.DOT} **Assignee:** *Unassigned*`;
            }

            const author = {
                name: user.visibleName,
                url: CONFIG.YOUTRACK_URL + "/users/" + user.login,
                icon_url: CONFIG.USER_AVATAR_URL
            };

            const fields = [
                {name: "📁 Project", value: `**${issue.project.name}**`, inline: true},
                {name: "🆔 Issue ID", value: `\`${issue.id}\``, inline: true}
            ];

            if (issue.Type) {
                fields.push({name: "📋 Type", value: issue.Type.name, inline: true});
            }

            const embed = createDiscordEmbed(
                title,
                description,
                getEmbedColor(issue, CONFIG.COLOR_NEGATIVE),
                issue.url,
                author,
                fields,
                `${CONFIG.SITE_NAME} ${CONFIG.VISUAL_ELEMENTS.DOT} ${issue.project.name}`,
                CONFIG.THUMBNAIL_URL
            );

            const payload = new Payload(null, CONFIG.SENDER_NAME, CONFIG.AVATAR_URL);
            payload._embeds = [embed]; // Manually set the embed array
            payload.send(CONFIG.WEBHOOK_URL);
            return;
        }

        // TYPE CHANGES
        else if (issue.isChanged("Type")) {
            const oldType = issue.oldValue("Type");
            const newType = issue.Type;
            const typeEmoji = getTypeEmoji(newType);

            const title = `${CONFIG.EMOJIS.UPDATED} Type Changed: ${issue.id}`;

            let description = `${CONFIG.EMOJIS.UPDATED} **${issue.summary}**\n\n`;
            description += `${CONFIG.VISUAL_ELEMENTS.DOT} **Type:** ${oldType ? oldType.name : 'None'} ${CONFIG.VISUAL_ELEMENTS.ARROW} ${typeEmoji} **${newType ? newType.name : 'None'}**`;

            const author = {
                name: user.visibleName,
                url: CONFIG.YOUTRACK_URL + "/users/" + user.login,
                icon_url: CONFIG.USER_AVATAR_URL
            };

            const fields = [
                {name: "📁 Project", value: `**${issue.project.name}**`, inline: true},
                {name: "🆔 Issue ID", value: `\`${issue.id}\``, inline: true},
                {name: "📊 Status", value: issue.State ? issue.State.name : 'Open', inline: true}
            ];

            const embed = createDiscordEmbed(
                title,
                description,
                getEmbedColor(issue, CONFIG.COLOR_REGULAR),
                issue.url,
                author,
                fields,
                `${CONFIG.SITE_NAME} ${CONFIG.VISUAL_ELEMENTS.DOT} ${issue.project.name}`,
                CONFIG.THUMBNAIL_URL
            );

            const payload = new Payload(null, CONFIG.SENDER_NAME, CONFIG.AVATAR_URL);
            payload._embeds = [embed];
            payload.send(CONFIG.WEBHOOK_URL);
            return;
        }

        // CATEGORY CHANGES
        else if (issue.isChanged("Category")) {
            const oldCategory = issue.oldValue("Category");
            const newCategory = issue.Category;
            const categoryEmoji = getCategoryEmoji(newCategory);

            const title = `${CONFIG.EMOJIS.UPDATED} Category Changed: ${issue.id}`;

            let description = `${CONFIG.EMOJIS.UPDATED} **${issue.summary}**\n\n`;
            description += `${CONFIG.VISUAL_ELEMENTS.DOT} **Category:** ${oldCategory ? oldCategory.name : 'None'} ${CONFIG.VISUAL_ELEMENTS.ARROW} ${categoryEmoji} **${newCategory ? newCategory.name : 'None'}**`;

            const author = {
                name: user.visibleName,
                url: CONFIG.YOUTRACK_URL + "/users/" + user.login,
                icon_url: CONFIG.USER_AVATAR_URL
            };

            const fields = [
                {name: "📁 Project", value: `**${issue.project.name}**`, inline: true},
                {name: "🆔 Issue ID", value: `\`${issue.id}\``, inline: true},
                {name: "📊 Status", value: issue.State ? issue.State.name : 'Open', inline: true}
            ];

            const embed = createDiscordEmbed(
                title,
                description,
                getEmbedColor(issue, CONFIG.COLOR_REGULAR),
                issue.url,
                author,
                fields,
                `${CONFIG.SITE_NAME} ${CONFIG.VISUAL_ELEMENTS.DOT} ${issue.project.name}`,
                CONFIG.THUMBNAIL_URL
            );

            const payload = new Payload(null, CONFIG.SENDER_NAME, CONFIG.AVATAR_URL);
            payload._embeds = [embed];
            payload.send(CONFIG.WEBHOOK_URL);
            return;
        }

        // ISSUE RESOLVED
        else if (issue.becomesResolved) {
            const title = `${CONFIG.EMOJIS.RESOLVED} Issue Resolved: ${issue.id}`;

            let description = `${CONFIG.EMOJIS.DONE} **${issue.summary}**\n\n`;
            description += `> ✅ This issue has been successfully resolved!\n\n`;
            description += `${CONFIG.VISUAL_ELEMENTS.DOT} **Final Status:** ${issue.State ? issue.State.name : 'Resolved'}\n`;
            description += `${CONFIG.VISUAL_ELEMENTS.DOT} **Resolution Time:** <t:${Math.floor(Date.now() / 1000)}:R>`;

            const author = {
                name: user.visibleName,
                url: CONFIG.YOUTRACK_URL + "/users/" + user.login,
                icon_url: CONFIG.USER_AVATAR_URL
            };

            const fields = [
                {name: "📁 Project", value: `**${issue.project.name}**`, inline: true},
                {name: "🆔 Issue ID", value: `\`${issue.id}\``, inline: true},
                {name: "📊 Final State", value: `**${issue.State ? issue.State.name : 'Resolved'}**`, inline: true}
            ];

            const embed = createDiscordEmbed(
                title,
                description,
                CONFIG.COLOR_POSITIVE,
                issue.url,
                author,
                fields,
                `${CONFIG.SITE_NAME} ${CONFIG.VISUAL_ELEMENTS.DOT} ${issue.project.name}`,
                CONFIG.THUMBNAIL_URL
            );

            const payload = new Payload(null, CONFIG.SENDER_NAME, CONFIG.AVATAR_URL);
            payload._embeds = [embed];
            payload.send(CONFIG.WEBHOOK_URL);
            return;
        }

        // PRIORITY CHANGES
        else if (issue.isChanged("Priority")) {
            const oldPriority = issue.oldValue("Priority");
            const newPriority = issue.Priority;
            const priorityEmoji = getPriorityEmoji(newPriority);

            const title = `${CONFIG.EMOJIS.PRIORITY} Priority Changed: ${issue.id}`;

            let description = `${CONFIG.EMOJIS.UPDATED} **${issue.summary}**\n\n`;
            description += `${CONFIG.VISUAL_ELEMENTS.DOT} **Priority:** ${oldPriority ? oldPriority.name : 'None'} ${CONFIG.VISUAL_ELEMENTS.ARROW} ${priorityEmoji} **${newPriority ? newPriority.name : 'None'}**`;

            const author = {
                name: user.visibleName,
                url: CONFIG.YOUTRACK_URL + "/users/" + user.login,
                icon_url: CONFIG.USER_AVATAR_URL
            };

            const fields = [
                {name: "📁 Project", value: `**${issue.project.name}**`, inline: true},
                {name: "🆔 Issue ID", value: `\`${issue.id}\``, inline: true},
                {name: "📊 Status", value: issue.State ? issue.State.name : 'Open', inline: true}
            ];

            const embed = createDiscordEmbed(
                title,
                description,
                getEmbedColor(issue, CONFIG.COLOR_REGULAR),
                issue.url,
                author,
                fields,
                `${CONFIG.SITE_NAME} ${CONFIG.VISUAL_ELEMENTS.DOT} ${issue.project.name}`,
                CONFIG.THUMBNAIL_URL
            );

            const payload = new Payload(null, CONFIG.SENDER_NAME, CONFIG.AVATAR_URL);
            payload._embeds = [embed];
            payload.send(CONFIG.WEBHOOK_URL);
            return;
        }

        // STAGE/STATUS CHANGES
        else if (issue.isChanged("Stage")) {
            const oldStage = issue.oldValue("Stage");
            const newStage = issue.Stage;

            const title = `${CONFIG.EMOJIS.UPDATED} Stage Changed: ${issue.id}`;

            let description = `${CONFIG.EMOJIS.UPDATED} **${issue.summary}**\n\n`;
            description += `${CONFIG.VISUAL_ELEMENTS.DOT} **Stage:** ${oldStage ? oldStage.name : 'None'} ${CONFIG.VISUAL_ELEMENTS.ARROW} **${newStage ? newStage.name : 'None'}**`;

            const author = {
                name: user.visibleName,
                url: CONFIG.YOUTRACK_URL + "/users/" + user.login,
                icon_url: CONFIG.USER_AVATAR_URL
            };

            const fields = [
                {name: "📁 Project", value: `**${issue.project.name}**`, inline: true},
                {name: "🆔 Issue ID", value: `\`${issue.id}\``, inline: true},
                {name: "⚠️ Priority", value: issue.Priority ? issue.Priority.name : 'Unset', inline: true}
            ];

            const embed = createDiscordEmbed(
                title,
                description,
                getEmbedColor(issue, CONFIG.COLOR_REGULAR),
                issue.url,
                author,
                fields,
                `${CONFIG.SITE_NAME} ${CONFIG.VISUAL_ELEMENTS.DOT} ${issue.project.name}`,
                CONFIG.THUMBNAIL_URL
            );

            const payload = new Payload(null, CONFIG.SENDER_NAME, CONFIG.AVATAR_URL);
            payload._embeds = [embed];
            payload.send(CONFIG.WEBHOOK_URL);
            return;
        }

        // STATE CHANGES (Status changes like Open -> In Progress -> Resolved)
        else if (issue.isChanged("State")) {
            const oldState = issue.oldValue("State");
            const newState = issue.State;

            const title = `${CONFIG.EMOJIS.UPDATED} Status Changed: ${issue.id}`;

            let description = `${CONFIG.EMOJIS.UPDATED} **${issue.summary}**\n\n`;
            description += `${CONFIG.VISUAL_ELEMENTS.DOT} **Status:** ${oldState ? oldState.name : 'None'} ${CONFIG.VISUAL_ELEMENTS.ARROW} **${newState ? newState.name : 'None'}**`;

            const author = {
                name: user.visibleName,
                url: CONFIG.YOUTRACK_URL + "/users/" + user.login,
                icon_url: CONFIG.USER_AVATAR_URL
            };

            const fields = [
                {name: "📁 Project", value: `**${issue.project.name}**`, inline: true},
                {name: "🆔 Issue ID", value: `\`${issue.id}\``, inline: true},
                {name: "⚠️ Priority", value: issue.Priority ? issue.Priority.name : 'Unset', inline: true}
            ];

            const embed = createDiscordEmbed(
                title,
                description,
                getEmbedColor(issue, CONFIG.COLOR_REGULAR),
                issue.url,
                author,
                fields,
                `${CONFIG.SITE_NAME} ${CONFIG.VISUAL_ELEMENTS.DOT} ${issue.project.name}`,
                CONFIG.THUMBNAIL_URL
            );

            const payload = new Payload(null, CONFIG.SENDER_NAME, CONFIG.AVATAR_URL);
            payload._embeds = [embed];
            payload.send(CONFIG.WEBHOOK_URL);
            return;
        }

        // ASSIGNEE CHANGES
        else if (issue.isChanged("Assignee")) {
            const oldAssignee = issue.oldValue("Assignee");
            const newAssignee = issue.Assignee;

            const title = `${CONFIG.EMOJIS.ASSIGNED} Assignee Changed: ${issue.id}`;

            let description = `${CONFIG.EMOJIS.UPDATED} **${issue.summary}**\n\n`;
            description += `${CONFIG.VISUAL_ELEMENTS.DOT} **Assignee:** ${oldAssignee ? oldAssignee.visibleName : 'Unassigned'} ${CONFIG.VISUAL_ELEMENTS.ARROW} **${newAssignee ? newAssignee.visibleName : 'Unassigned'}**`;

            const author = {
                name: user.visibleName,
                url: CONFIG.YOUTRACK_URL + "/users/" + user.login,
                icon_url: CONFIG.USER_AVATAR_URL
            };

            const fields = [
                {name: "📁 Project", value: `**${issue.project.name}**`, inline: true},
                {name: "🆔 Issue ID", value: `\`${issue.id}\``, inline: true},
                {name: "📊 Status", value: issue.State ? issue.State.name : 'Open', inline: true}
            ];

            const embed = createDiscordEmbed(
                title,
                description,
                getEmbedColor(issue, CONFIG.COLOR_REGULAR),
                issue.url,
                author,
                fields,
                `${CONFIG.SITE_NAME} ${CONFIG.VISUAL_ELEMENTS.DOT} ${issue.project.name}`,
                CONFIG.THUMBNAIL_URL
            );

            const payload = new Payload(null, CONFIG.SENDER_NAME, CONFIG.AVATAR_URL);
            payload._embeds = [embed];
            payload.send(CONFIG.WEBHOOK_URL);
            return;
        }

        // COMMENTS
        else if (issue.comments.isChanged && issue.comments.added.size > 0) {
            const comment = issue.comments.added.get(0);
            let commentText = comment.text;

            if (commentText.length > 300) {
                commentText = commentText.substring(0, 300) + "...";
            }

            const title = `${CONFIG.EMOJIS.COMMENT} Comment Added: ${issue.id}`;

            let description = `${CONFIG.EMOJIS.COMMENT} **${issue.summary}**\n\n`;
            description += `**New Comment:**\n>>> ${commentText}`;

            const author = {
                name: user.visibleName,
                url: CONFIG.YOUTRACK_URL + "/users/" + user.login,
                icon_url: CONFIG.USER_AVATAR_URL
            };

            const fields = [
                {name: "📁 Project", value: `**${issue.project.name}**`, inline: true},
                {name: "🆔 Issue ID", value: `\`${issue.id}\``, inline: true}
            ];

            if (issue.Assignee) {
                fields.push({name: "👤 Assignee", value: issue.Assignee.visibleName, inline: true});
            }

            const embed = createDiscordEmbed(
                title,
                description,
                getEmbedColor(issue, CONFIG.COLOR_INFO),
                issue.url,
                author,
                fields,
                `${CONFIG.SITE_NAME} ${CONFIG.VISUAL_ELEMENTS.DOT} ${issue.project.name}`,
                CONFIG.THUMBNAIL_URL
            );

            const payload = new Payload(null, CONFIG.SENDER_NAME, CONFIG.AVATAR_URL);
            payload._embeds = [embed];
            payload.send(CONFIG.WEBHOOK_URL);
            return;
        }
    }
});