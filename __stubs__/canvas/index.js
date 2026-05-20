// No-op stub for the native `canvas` package.
//
// Why this exists:
//   pdfjs-dist@4.x (pulled in by react-pdf@9.x) declares `canvas` as an
//   optionalDependency. Yarn berry still tries to build it during install,
//   which fails on machines without Cairo/Pango (most CI and many dev boxes).
//   Replacing the real package with this stub via root resolutions sidesteps
//   the native build without losing PDF rendering (jsdom only uses canvas
//   for an optional integration we don't exercise).
//
// When this can go away:
//   Once Next.js bundles webpack >= 5.103.0 (webpack/webpack#20095), we can
//   safely bump react-pdf 9 -> 10 which pulls pdfjs-dist 5.x — that line
//   replaces `canvas` with the prebuilt `@napi-rs/canvas`, so neither this
//   stub nor the matching root `resolutions["canvas"]` entry will be needed.
//   See vercel/next.js#89177 for the upstream tracking issue.
module.exports = {};
