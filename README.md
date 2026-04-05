# Color by Number

A browser-based color-by-number puzzle game built with React and Vite. Solve included puzzles or generate your own from any image.

## Getting started

```bash
npm install
npm run dev       # dev server with hot reload at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build locally
```

## Features

- **Gallery** — browse and play built-in demo puzzles
- **Image importer** — drag-and-drop any image to convert it into a puzzle using median-cut color quantization
- **Three detail levels** — Very Abstract (15×15, 6 colors), Medium (25×25, 10 colors), Detailed (40×40, 16 colors)
- **Progress persistence** — game state saved automatically to `localStorage` per puzzle
- **Download** — export any generated puzzle as a `.json` file for later use
- **Touch support** — playable on mobile

## How to play

| Action | Result |
|---|---|
| Left click a cell | Fill with selected color |
| Right click a cell | Erase cell |
| Select a swatch in the palette | Change active color |

The puzzle is complete when every non-background cell is filled with its correct color.

## Adding puzzles

Drop a `.json` file in `public/puzzles/` and add its path to the `DEMO_FILES` array in `src/components/Gallery.jsx`.

Puzzle format:

```json
{
  "id": "unique_id",
  "title": "Puzzle Name",
  "width": 15,
  "height": 15,
  "colors": {
    "1": "#e63946",
    "2": "#ff9fb2"
  },
  "grid": [
    [0, 0, 1, 1, 0],
    [0, 1, 2, 1, 0]
  ]
}
```

`0` is the background (transparent) cell — it cannot be filled.

## Infrastructure (Terraform)

All infrastructure is defined in `terraform/` and deploys a secure VPC, private S3 bucket, and CloudFront distribution to AWS.

### Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.6.0
- AWS CLI configured with sufficient permissions

### First-time setup

```bash
cd terraform
terraform init
```

State is stored remotely in S3 (`terraform-state-golden-capybara`) with DynamoDB locking (`terraform-state-lock`). Both were pre-created via AWS CLI.

### Common commands

```bash
# Preview changes without applying
terraform plan

# Apply changes
terraform apply

# Destroy all infrastructure
terraform destroy

# Show current state outputs (CloudFront URL, bucket name, etc.)
terraform output

# Refresh outputs without making changes
terraform apply -refresh-only
```

### Deploy the app

After `terraform apply`, upload the built app and invalidate the CloudFront cache:

```bash
# Build the app
npm run build

# Upload to S3 (get bucket name from terraform output)
aws s3 sync dist/ s3://$(terraform -chdir=terraform output -raw s3_bucket_name) --delete

# Invalidate CloudFront cache (get distribution ID from terraform output)
aws cloudfront create-invalidation \
  --distribution-id $(terraform -chdir=terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

The live URL is available via:

```bash
terraform -chdir=terraform output cloudfront_url
```

## Project structure

```
src/
  App.jsx                     # Top-level router: Gallery ↔ PuzzleView
  index.css                   # All styles (dark theme, CSS variables)
  components/
    Gallery.jsx               # Puzzle listing + image importer
    PuzzleCard.jsx            # Thumbnail card in the gallery
    PuzzleView.jsx            # Puzzle gameplay screen
    PuzzleCanvas.jsx          # Imperative canvas rendering + input handling
    Palette.jsx               # Color swatch sidebar
    ImageImporter.jsx         # Drag-drop image → puzzle UI
    CompletionOverlay.jsx     # Shown when puzzle is solved
  hooks/
    usePuzzleGame.js          # All game state (fill, erase, progress, completion)
  services/
    image-converter.js        # Converts an image File to puzzle JSON
    color-quantizer.js        # Median-cut color quantization algorithm
public/
  puzzles/
    demo1.json                # Heart (15×15)
    demo2.json                # Demo puzzle (15×15)
```

## Changelog

### Cell style toggle (square / circle)
- Added a **Cell Style** toggle in the palette sidebar with square and circle options
- Circle mode renders each puzzle cell as a circle — unfilled cells show a dim ring with the number, filled cells show a solid colored disc; background cells are left empty
- Square mode is the original grid rendering
- Preference persisted to `localStorage` under the key `cellShape` so it carries across sessions
- Hover highlight adapts to the active shape (circle arc vs rectangle outline)

### Image importer — live puzzle preview
- After uploading an image, the importer now renders a live solved-state preview of the resulting puzzle before the user commits to playing
- Changing the **Detail Level** dropdown re-generates the preview automatically (debounced 250 ms) — no need to click anything
- The extracted color palette is displayed as swatches beneath the preview with a color count
- **Play Puzzle** and **Download JSON** reuse the already-generated preview directly, eliminating a redundant conversion pass
- Spinner shown while preview is generating
- Layout: puzzle preview (left, prominent) + original image thumbnail + settings (right sidebar); stacks vertically on narrow screens


### Dark theme overhaul
- Replaced light palette with a dark theme across all CSS variables:
  - Background: `#0f0f11`, surfaces: `#1a1a1f` / `#222228`
  - Accent changed from blue (`#3a86ff`) to purple (`#7c6af7`)
- Gallery title renders as a white-to-purple gradient with bold weight
- Puzzle cards lift and show a purple accent border glow on hover
- Canvas cells use dark backgrounds (`#16161c`) with muted purple grid lines
- Hover highlight on canvas uses accent purple instead of black
- Selected palette swatch glows with `rgba(124,106,247,0.25)`
- Completion overlay card has deep shadow + accent-colored outline ring
- Form inputs show purple focus ring
- Scrollbar styled to match dark theme (`scrollbar-width: thin`)
- Completion preview background updated from white to dark (`#0d0d10`)
