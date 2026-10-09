# MAS Digital Service — PWA

Files in this folder (upload ALL of them to the repository root, keep the `icons` folder):

    index.html              the app
    manifest.webmanifest    app name, colours, icons
    sw.js                   service worker (offline + fast start)
    icons/                  app icons
    .nojekyll               tells GitHub Pages to serve files as they are (optional)

## Put it on GitHub Pages
1. Sign in at github.com  ->  "+" (top right)  ->  New repository.
2. Repository name: mas-pwa   |   choose Public   |   Create repository.
3. Click "uploading an existing file", drag in everything from this folder (index.html, manifest.webmanifest,
   sw.js, the icons folder), then Commit changes.
   (Or with git:  git init && git add . && git commit -m "MAS PWA" && git branch -M main &&
    git remote add origin https://github.com/<your-username>/mas-pwa.git && git push -u origin main)
4. Settings -> Pages -> Build and deployment -> Source: "Deploy from a branch" ->
   Branch: main, folder: /(root) -> Save.
5. After 1-2 minutes the app is live at  https://<your-username>.github.io/mas-pwa/

## Install on the phone
- Android (Chrome): open the link -> menu (3 dots) -> Install app. Or profile menu inside the app -> Install app.
- iPhone (Safari only): open the link -> Share -> Add to Home Screen.

## Updating later
- Edit index.html on GitHub (pencil icon) or upload the new file -> Commit.
- If you change other files (icons, manifest), also change CACHE = "mas-v1" to "mas-v2" in sw.js.
- Open the app twice (or close and reopen) to see the new version.

## Important
GitHub Pages sites are PUBLIC. Anyone with the link can read index.html, including the sample sales data and the
demo passwords in it. Use this for the demo only. For real data, load it from your secured cloud API after login.
