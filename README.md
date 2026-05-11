# Epsylon Web

Epsylon Web is a small frontend client for the Epsylon API. It is built with plain HTML, CSS, and JavaScript so it can run without Node, React, or a build step.

## Features

- Connect to a configurable Epsylon API URL.
- Check API health.
- Create, list, edit, complete, and delete tasks.
- Filter tasks by status.
- Store the API URL in local storage.

## Run Locally

Start the Epsylon API first:

```bash
uvicorn app.main:app --reload
```

Then open `index.html` in a browser.

If the browser blocks requests from a local file, serve this folder with any static server. For example, once Python is installed:

```bash
python -m http.server 5173
```

Then visit:

```text
http://127.0.0.1:5173
```

## API

The default API URL is:

```text
http://127.0.0.1:8000
```

You can change it from the sidebar in the app.
