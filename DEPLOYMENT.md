# GitHub Pages deployment

The portfolio is prepared for the GitHub Pages project site at:

`https://lohithcoders.github.io/Lohith-Portfolio/`

The `Build and deploy portfolio` workflow builds the Next.js App Router pages as static files and deploys them from the `rebuild` branch. It also creates the required `.nojekyll` file. The repository must be named `Lohith-Portfolio` for its configured base path and site URL to match.

For the first deployment, set the repository's **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. Later pushes to `rebuild` run the workflow automatically.

To build the static site locally, run `npm ci` and `npm run build:pages`; the generated site is in `out/`.

GitHub Pages serves static files and does not run a Next.js API server. The contact form validates its fields and opens the visitor's email app with a prefilled message. Sending the message remains under the visitor's control.
