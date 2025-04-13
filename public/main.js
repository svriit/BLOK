// main.js - Fixed version with enhanced debugging

// Import existing libraries
import { Pane } from 'https://cdn.skypack.dev/tweakpane@4.0.4'
import gsap from 'https://cdn.skypack.dev/gsap@3.12.0'
import ScrollTrigger from 'https://cdn.skypack.dev/gsap@3.12.0/ScrollTrigger'

// Configuration object
const config = {
  animate: true,
  start: 0,
  end: 360
};

// MongoDB connection function with better debugging
async function saveVoteToMongoDB(voteType) {
  console.log('saveVoteToMongoDB called with voteType:', voteType);
  
  // Check that API endpoint is correct - adjust path if needed
  const apiEndpoint = '/api/save-vote';
  console.log('Sending request to:', apiEndpoint);
  
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        voteType: voteType, // 'up' or 'down'
        timestamp: new Date().toISOString(),
      }),
    });

    console.log('API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      try {
        const errorDetails = JSON.parse(errorText);
        throw new Error(errorDetails.error || 'Failed to save vote');
      } catch (parseError) {
        throw new Error(`Failed to save vote: Status ${response.status}`);
      }
    }

    const result = await response.json();
    console.log('API success response:', result);
    return result;
  } catch (error) {
    console.error('Error saving vote:', error);
    // Alert for debugging in browser
    alert(`Error saving vote: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Function to get votes from MongoDB
async function getVotesFromMongoDB() {
  const apiEndpoint = '/api/get-votes';
  console.log('Getting votes from:', apiEndpoint);
  
  try {
    const response = await fetch(apiEndpoint);
    console.log('Get votes response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      try {
        const errorDetails = JSON.parse(errorText);
        throw new Error(errorDetails.error || 'Failed to get votes');
      } catch (parseError) {
        throw new Error(`Failed to get votes: Status ${response.status}`);
      }
    }
    
    const result = await response.json();
    console.log('Vote counts retrieved:', result);
    return result;
  } catch (error) {
    console.error('Error getting votes:', error);
    return { upVotes: 0, downVotes: 0 };
  }
}

// Function to refresh vote counts
async function refreshVoteCounts() {
  try {
    const voteCounts = await getVotesFromMongoDB();
    console.log('Refreshed vote counts:', voteCounts);

    const thumbsUpCount = document.getElementById('thumbsUpCount');
    const thumbsDownCount = document.getElementById('thumbsDownCount');

    if (thumbsUpCount && thumbsDownCount) {
      thumbsUpCount.textContent = voteCounts.upVotes || '0';
      thumbsDownCount.textContent = voteCounts.downVotes || '0';
    }
  } catch (error) {
    console.error('Failed to refresh vote counts:', error);
  }
}

// Original GSAP animation code (unchanged)
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

// Modified DOM ready function with enhanced debugging and error handling
function setupVotingSystem() {
  console.log('Setting up voting system...');
  
  // Check if elements exist
  const thumbsUp = document.getElementById('thumbsUp');
  const thumbsDown = document.getElementById('thumbsDown');
  const thumbsUpCount = document.getElementById('thumbsUpCount');
  const thumbsDownCount = document.getElementById('thumbsDownCount');
  
  if (!thumbsUp || !thumbsDown || !thumbsUpCount || !thumbsDownCount) {
    console.error('Missing voting elements:', { 
      thumbsUp: !!thumbsUp, 
      thumbsDown: !!thumbsDown, 
      thumbsUpCount: !!thumbsUpCount, 
      thumbsDownCount: !!thumbsDownCount 
    });
    return; // Exit if elements don't exist
  }
  
  console.log('Found all voting elements');
  
  // Load initial vote counts from MongoDB
  getVotesFromMongoDB()
    .then(voteCounts => {
      console.log('Initial vote counts:', voteCounts);
      thumbsUpCount.textContent = voteCounts.upVotes || '0';
      thumbsDownCount.textContent = voteCounts.downVotes || '0';
    })
    .catch(error => {
      console.error('Failed to load vote counts:', error);
      // Fallback to local storage
      thumbsUpCount.textContent = localStorage.getItem('upVotes') || '0';
      thumbsDownCount.textContent = localStorage.getItem('downVotes') || '0';
    });
  
  // Handle thumbs up with MongoDB integration
  thumbsUp.addEventListener('click', async function (event) {
    event.preventDefault(); // Prevent any default behavior
    console.log('Thumbs up clicked');

    // Check if already voted
    if (localStorage.getItem('voted') === 'true') {
      console.log('Already voted, ignoring click');
      return;
    }

    // Visual feedback immediately
    thumbsUp.classList.add('active');
    thumbsDown.classList.remove('active');
    thumbsUp.disabled = true;
    thumbsDown.disabled = true;

    // Update local display
    const currentCount = parseInt(thumbsUpCount.textContent || '0');
    thumbsUpCount.textContent = (currentCount + 1).toString();

    console.log('About to call saveVoteToMongoDB');
    try {
      const result = await saveVoteToMongoDB('up');
      console.log('Vote saved result:', result);

      if (result.success) {
        // Update with server counts
        thumbsUpCount.textContent = result.upVotes || currentCount + 1;
        thumbsDownCount.textContent = result.downVotes || thumbsDownCount.textContent;

        // Mark as voted locally only after successful API call
        localStorage.setItem('voted', 'true');
        await refreshVoteCounts(); // Refresh the vote counts after saving
      } else {
        console.error('Failed to save vote:', result.error);
        // Re-enable buttons if the API call fails
        thumbsUp.disabled = false;
        thumbsDown.disabled = false;
      }
    } catch (error) {
      console.error('Error in vote saving process:', error);
      // Re-enable buttons if the API call fails
      thumbsUp.disabled = false;
      thumbsDown.disabled = false;
    }
  });

  // Handle thumbs down with MongoDB integration
  thumbsDown.addEventListener('click', async function (event) {
    event.preventDefault(); // Prevent any default behavior
    console.log('Thumbs down clicked');

    // Check if already voted
    if (localStorage.getItem('voted') === 'true') {
      console.log('Already voted, ignoring click');
      return;
    }

    // Visual feedback immediately
    thumbsDown.classList.add('active');
    thumbsUp.classList.remove('active');
    thumbsUp.disabled = true;
    thumbsDown.disabled = true;

    // Update local display
    const currentCount = parseInt(thumbsDownCount.textContent || '0');
    thumbsDownCount.textContent = (currentCount + 1).toString();

    console.log('About to call saveVoteToMongoDB');
    try {
      const result = await saveVoteToMongoDB('down');
      console.log('Vote saved result:', result);

      if (result.success) {
        // Update with server counts
        thumbsUpCount.textContent = result.upVotes || thumbsUpCount.textContent;
        thumbsDownCount.textContent = result.downVotes || currentCount + 1;

        // Mark as voted locally only after successful API call
        localStorage.setItem('voted', 'true');
        await refreshVoteCounts(); // Refresh the vote counts after saving
      } else {
        console.error('Failed to save vote:', result.error);
        // Re-enable buttons if the API call fails
        thumbsUp.disabled = false;
        thumbsDown.disabled = false;
      }
    } catch (error) {
      console.error('Error in vote saving process:', error);
      // Re-enable buttons if the API call fails
      thumbsUp.disabled = false;
      thumbsDown.disabled = false;
    }
  });

  console.log('Voting system setup complete');
}

// Ensure DOM is fully loaded before setting up voting
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupVotingSystem);
} else {
  // DOM already loaded, set up immediately
  setupVotingSystem();
}