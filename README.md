# Water Buddy

A free installable PWA for funny water reminders with random characters and multilingual chat prompts.

## What is inside

- Installable home-screen web app for iPhone and Android
- English, Hindi, and Malayalam dialogue packs
- Cute, filmy, and savage reminder modes
- Offline-ready cached UI through a service worker
- Local saved progress using browser storage
- App manifest, standalone display mode, and Apple home-screen meta tags

## Run locally

1. Install dependencies:
   `npm install`
2. Start the web app:
   `npm run dev`
3. Open the shown local URL in a browser

## Install on iPhone for free

1. Deploy the site over HTTPS
2. Open the deployed link in Safari on iPhone
3. Tap `Share`
4. Tap `Add to Home Screen`
5. Launch it from the home screen like an app

## Important limitation

- This free version is a PWA, not an App Store app.
- It can feel app-like and work offline, but truly random closed-app push reminders on iPhone still need a push backend and web-push setup.
- No paid Apple Developer account is required for the home-screen install flow.

## Notifications

- The app now includes service-worker notification handling and a test notification button.
- On supported mobile browsers, this can show a real system notification after permission is granted.
- For actual closed-app recurring push notifications, you still need a deployed backend that sends Web Push messages to subscribed devices.

## Next upgrades

- Add free hosting so it can be shared by link
- Add web push support for platforms/browsers that allow it
- Add real character art instead of emoji
- Add streaks, unlockables, and better onboarding
