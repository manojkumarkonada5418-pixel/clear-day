# Clear Day

A responsive, buildless cigarette tracker rebuilt from quit_smoking_v2_complete.zip. Serve the repository root using any static web server. No build or dependencies are required. All user data is browser-local; this version has no authentication, backend or cross-device sync.

Features: cigarette logging and undo; dated history; explicit smoke-free check-in in My history; editable baseline, daily target, brand, name, cost and start date; historical spending using the cost recorded at logging time; estimated savings; JSON export; accessible 60-second breathing timer; responsive dashboard.

Untracked days are not counted as smoke-free. Journey days mean calendar days since the configured start, not abstinence. Savings compare current spending with the configured usual daily baseline and can change until the day ends. Changing cost affects new entries only. Export is a backup file; restoring via an import interface is not implemented.

Storage uses localStorage key clear-day-v1. Clearing browser data deletes entries. Google Fonts is optional; system fallbacks work without it. No analytics or third-party authentication SDK is used. To add production phone authentication, use server-verified identity and per-user durable records; the original demo gate must not be reused as authentication.


The tap button shows today's count. Month average is cigarettes logged this calendar month divided by days tracked this month, including explicit zero check-ins. Untracked days and future dates are excluded. Tap sound is on by default and can be muted; the preference persists in the browser.
