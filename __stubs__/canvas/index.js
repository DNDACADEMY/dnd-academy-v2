// No-op stub for the native `canvas` package.
//
// Why this exists:
//   pdfjs-dist@4.x (pulled in by react-pdf@9.x) declares `canvas` as an
//   optionalDependency. The package manager still tries to build it during install,
//   which fails on machines without Cairo/Pango (most CI and many dev boxes).
//   Replacing the real package with this stub via pnpm overrides sidesteps
//   the native build without losing PDF rendering (jsdom only uses canvas
//   for an optional integration we don't exercise).
//
// When this can go away:
//   pdfjs-dist 5.x uses @napi-rs/canvas. Revisit this stub and the matching
//   pnpm override when the project viewer moves off react-pdf 9.x.
module.exports = {};
