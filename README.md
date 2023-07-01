**Note: This is not a NexusPIPE Product. It's a personal project of mine. It's not endorsed by NexusPIPE in any way.**

# NexusPIPE Dynamic IP Updating Utility

Update your dynamic IP origin on NexusPIPE automatically whenever it changes.<br/>
Run this on your origin, and it will automatically update your NexusPIPE origin IP whenever it changes.

---

*You should tripple-check the source code before running this, as with any program you write. It's just good security practice. Plus it'll take you like 5 minutes.*

## Authentication

### If you don't know what you're doing, avoid this utility. If you don't understand authentication tokens, and how sensitive they are, avoid this utility. Seriously.
#### Also, don't share this with **anyone**. Not even your dog. Not even your cat. Not even your pet rock. Not even your pet rock's pet rock. Not even your pet rock's pet rock's pet rock. Not even your pet rock's pet rock's pet rock's pet rock. Ok, you get the point - don't share this with anyone.

Make sure to export the environment variable `NEXUSPIPE_TOKEN` as your NexusPIPE API token.<br/>
For now, you'll need to fetch this from LocalStorage.

## Syntax

`update-nexus-ip spawn|run --app <app>:<port-on-your-device> [--app: <app>:<port-on-your-device> ...] [--proto http|https] [--interval <seconds>]` (--interval is only for spawn)

Example:

`update-nexus-ip spawn --app test.example.com:8080`
`update-nexus-ip spawn --app test.example.com:8080 --app test2.example.com:8090`
