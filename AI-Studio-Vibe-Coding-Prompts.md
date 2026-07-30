# 📱 Google AI Studio (Vibe Coding) Mobile & Chromebook Optimizations

Because you are using Google AI Studio on a **Chromebook** and an **Android phone** to preview your app, the application needs to run with extreme efficiency. Previews in AI Studio are loaded inside an iframe (a webpage-within-a-webpage), which can be highly resource-intensive for mobile devices and lightweight laptops.

Additionally, interacting with a dense timeline editor on a touch screen requires specific user interface adjustments.

---

## 🛠️ How to Use These Prompts
Simply **copy and paste** any of the prompts below directly into the **Google AI Studio chat** (under the "Build" section) where you develop your app. The AI Studio builder (Jules) will read these instructions and automatically modify your code for you!

---

### 🎨 Prompt 1: Optimize Layout for Android Screens (Mobile View)
*Copy and paste this into AI Studio to make the layout fit perfectly on your phone screen:*

```text
Please make the application interface fully mobile-responsive and thumb-friendly. 
1. Use Tailwind CSS breakpoints (like 'md:flex-row' and 'flex-col') so that on smaller screens (such as Android phones), the Side Panel collapses nicely either below or above the main Video Player.
2. Ensure the main layout occupies exactly the height of the screen ('h-screen' or 'min-h-[100dvh]') so that the user does not have to scroll the outer body page.
3. Make sure text sizes scale down on mobile viewports so that headers and settings text fit comfortably without overflowing.
```

---

### 👆 Prompt 2: Enhance Touch Target Sizes on Mobile
*Copy and paste this into AI Studio to make buttons much easier to press with your fingers:*

```text
Since this app is accessed on mobile phones, we need to optimize it for touch interactions:
1. Ensure all clickable buttons, play/pause controls, menu select options, and settings toggles are at least 44x44 pixels (or use padding like 'p-3' or 'p-4') to provide generous touch-target areas.
2. In the Timeline view, make the subtitle block drag handles slightly wider and taller so they can easily be selected and dragged using touch controls.
3. Add subtle tactile feedback styles (like scale-down or highlight on hover/tap) to buttons.
```

---

### 🚀 Prompt 3: Hardware Acceleration for Butter-Smooth Scrubbing
*Copy and paste this into AI Studio to offload timeline rendering onto your device's graphics card, making scrolling instant:*

```text
Please optimize the Timeline playhead, scrolling indicators, and subtitle blocks to use hardware-accelerated CSS.
1. Add 'transform: translate3d(0, 0, 0)' or 'will-change-transform' inline styles to the active timeline playhead cursor so the browser uses GPU rendering during live playback scrubbing.
2. Use modern CSS transition properties ('transition-transform' and 'duration-75') instead of raw pixel calculation animations to keep scrolling highly responsive on low-end Chromebook devices.
```

---

### 🧠 Prompt 4: Streamline Zustand Store to Prevent Lag
*Copy and paste this into AI Studio to stop the browser from freezing when updating subtitles:*

```text
Please optimize how our React components subscribe to the Zustand store in `src/store.ts`.
1. Make sure we DO NOT use a single destructuring hook like `const state = useStore()` inside our components.
2. Instead, rewrite the subscriptions using selective selectors (for example: `const subtitles = useStore(state => state.subtitles)` or `const isPlaying = useStore(state => state.isPlaying)`).
3. This ensures that when the playhead position ticks rapidly, ONLY the elements displaying the time are re-rendered, leaving the rest of the timeline and sidebars static. This will prevent lagging on Chromebooks.
```
