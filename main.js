// Import existing libraries
import { Pane } from 'https://cdn.skypack.dev/tweakpane@4.0.4'
import gsap from 'https://cdn.skypack.dev/gsap@3.12.0'
import ScrollTrigger from 'https://cdn.skypack.dev/gsap@3.12.0/ScrollTrigger'

// Configuration object (missing in original code)
const config = {
  animate: true,
  start: 0,
  end: 360
};

let items
let scrollerScrub
let dimmerScrub
let chromaEntry
let chromaExit

const update = () => {
  if (!config.animate) {
    chromaEntry?.scrollTrigger.disable(true, false)
    chromaExit?.scrollTrigger.disable(true, false)
    dimmerScrub?.disable(true, false)
    scrollerScrub?.disable(true, false)
    gsap.set(items, { opacity: 1 })
    gsap.set(document.documentElement, { '--chroma': 0 })
  } else {
    gsap.set(items, { opacity: (i) => (i !== 0 ? 0.2 : 1) })
    dimmerScrub?.enable(true, true)
    scrollerScrub?.enable(true, true)
    chromaEntry?.scrollTrigger.enable(true, true)
    chromaExit?.scrollTrigger.enable(true, true)
  }
}

// backfill the scroll functionality with GSAP
if (
  !CSS.supports('(animation-timeline: scroll()) and (animation-range: 0% 100%)')
) {
  gsap.registerPlugin(ScrollTrigger)

  // animate the items with GSAP if there's no CSS support
  items = gsap.utils.toArray('ul li')

  gsap.set(items, { opacity: (i) => (i !== 0 ? 0.2 : 1) })

  const dimmer = gsap
    .timeline()
    .to(items.slice(1), {
      opacity: 1,
      stagger: 0.5,
    })
    .to(
      items.slice(0, items.length - 1),
      {
        opacity: 0.2,
        stagger: 0.5,
      },
      0
    )

  dimmerScrub = ScrollTrigger.create({
    trigger: items[0],
    endTrigger: items[items.length - 1],
    start: 'center center',
    end: 'center center',
    animation: dimmer,
    scrub: 0.2,
  })

  // register scrollbar changer
  const scroller = gsap.timeline().fromTo(
    document.documentElement,
    {
      '--hue': config.start,
    },
    {
      '--hue': config.end,
      ease: 'none',
    }
  )

  scrollerScrub = ScrollTrigger.create({
    trigger: items[0],
    endTrigger: items[items.length - 1],
    start: 'center center',
    end: 'center center',
    animation: scroller,
    scrub: 0.2,
  })

  chromaEntry = gsap.fromTo(
    document.documentElement,
    {
      '--chroma': 0,
    },
    {
      '--chroma': 0.3,
      ease: 'none',
      scrollTrigger: {
        scrub: 0.2,
        trigger: items[0],
        start: 'center center+=40',
        end: 'center center',
      },
    }
  )
  chromaExit = gsap.fromTo(
    document.documentElement,
    {
      '--chroma': 0.3,
    },
    {
      '--chroma': 0,
      ease: 'none',
      scrollTrigger: {
        scrub: 0.2,
        trigger: items[items.length - 2],
        start: 'center center',
        end: 'center center-=40',
      },
    }
  )
}
// run it
update()

// FIX: Load DOM elements after the document is ready
document.addEventListener('DOMContentLoaded', () => {
  // Fix: No openModal button exists, using the about section instead
  const thumbsUp = document.getElementById('thumbsUp');
  const thumbsDown = document.getElementById('thumbsDown');
  const thumbsUpCount = document.getElementById('thumbsUpCount');
  const thumbsDownCount = document.getElementById('thumbsDownCount');
  
  // Local storage for persisting votes between page loads
  let upVotes = parseInt(localStorage.getItem('upVotes') || '0');
  let downVotes = parseInt(localStorage.getItem('downVotes') || '0');
  
  // Initialize counts from local storage
  thumbsUpCount.textContent = upVotes;
  thumbsDownCount.textContent = downVotes;
  
  // Removed logic for creating "Register Interest" button
  const aboutAction = document.querySelector('.about-action');
  if (aboutAction) {
    const registerBtn = document.getElementById('openModal');
    if (registerBtn) {
      registerBtn.remove();
    }
  }
  
  // Handle thumbs up
  if (thumbsUp) {
    thumbsUp.addEventListener('click', () => {
      if (localStorage.getItem('voted') === 'true') return; // Prevent multiple votes

      upVotes++;
      localStorage.setItem('upVotes', upVotes.toString());
      thumbsUpCount.textContent = upVotes;

      // Mark as voted
      localStorage.setItem('voted', 'true');

      // Visual feedback
      thumbsUp.classList.add('active');
      thumbsDown.classList.remove('active');

      // Disable both buttons
      thumbsUp.disabled = true;
      thumbsDown.disabled = true;
    });
  }
  
  // Handle thumbs down
  if (thumbsDown) {
    thumbsDown.addEventListener('click', () => {
      if (localStorage.getItem('voted') === 'true') return; // Prevent multiple votes

      downVotes++;
      localStorage.setItem('downVotes', downVotes.toString());
      thumbsDownCount.textContent = downVotes;

      // Mark as voted
      localStorage.setItem('voted', 'true');

      // Visual feedback
      thumbsDown.classList.add('active');
      thumbsUp.classList.remove('active');

      // Disable both buttons
      thumbsUp.disabled = true;
      thumbsDown.disabled = true;
    });
  }
});