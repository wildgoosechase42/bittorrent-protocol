/**
 * BitTorrent Protocol — Interactive Learning Laboratory
 * Client logic: Assessments, SVG Speedometers, Swarm Simulation & Scrollspy
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const state = {
    swarmActive: true,
    preTestScore: null,
    preTestSubmitted: false,
    preTestUserAnswers: {},
    postTestScore: null,
    postTestSubmitted: false,
    postTestUserAnswers: {},
  };

  // Pre-test questions dictionary & explanations
  const preTestKey = {
    pre_q1: {
      correct: 'A',
      title: 'P2P Network Architecture',
      question: 'What is the fundamental difference between a traditional Client-Server architecture and a Peer-to-Peer (P2P) network like BitTorrent?',
      explanation: 'In P2P architectures, every node can simultaneously function as a client (downloader) and a server (uploader). This distributes aggregate network bandwidth consumption across all swarm participants rather than funneling it onto a central server bottleneck.',
      options: {
        A: 'In P2P, every node can act as both a client (downloader) and a server (uploader), distributing the bandwidth load dynamically.',
        B: 'In P2P, all requests must pass through an authoritative central master database.',
        C: 'Client-server architectures do not require IP addresses, whereas P2P networks rely exclusively on domain names.',
        D: 'P2P architectures only support synchronous text streaming and cannot transfer binary file payloads.'
      }
    },
    pre_q2: {
      correct: 'B',
      title: 'Swarm Definition',
      question: 'In BitTorrent terminology, what is a "Swarm"?',
      explanation: 'A BitTorrent swarm represents the entire collective set of all peers connected together to share and exchange pieces of a specific infohash payload.',
      options: {
        A: 'The malicious denial-of-service flood launched by compromised zombie bots against a seeder.',
        B: 'The collective group of all peers participating in the upload and download of a specific shared file.',
        C: 'The physical cluster of server racks hosting the primary tracker daemon inside a colocation datacenter.',
        D: 'The private symmetric encryption key used to decode payload streams downloaded from private indexers.'
      }
    },
    pre_q3: {
      correct: 'B',
      title: 'Seeder Role',
      question: 'What is the defining characteristic of a "Seeder" within a BitTorrent network?',
      explanation: 'A Seeder is an unselfish peer holding 100% of the completed and verified file, dedicating its upstream network capacity strictly to uploading pieces to downloading peers (leechers).',
      options: {
        A: 'A peer that initiates the tracker handshake but downloads zero data blocks.',
        B: 'A peer that possesses a verified 100% complete copy of the file and exclusively uploads pieces to others.',
        C: 'The original file author who is legally required to maintain uninterrupted network uptime.',
        D: 'A hardware gateway router configured to drop upload packets during ISP peak hours.'
      }
    },
    pre_q4: {
      correct: 'B',
      title: 'Data Integrity',
      question: 'How does BitTorrent verify data integrity and detect corrupted pieces received from untrusted peers?',
      explanation: 'BitTorrent segments files into fixed pieces and pre-hashes each piece with SHA-1 inside the original .torrent metainfo file. Whenever a peer finishes receiving a piece, it hashes the binary data and compares the result against the authoritative metainfo hash.',
      options: {
        A: 'By relying on standard TCP checksums alone without any application-layer verification.',
        B: 'By checking each completed piece against cryptographic SHA-1 hashes stored in the .torrent metainfo file.',
        C: 'By querying the tracker server to perform a live remote read of the original disk file.',
        D: 'By taking a consensus vote among neighboring peers to decide if a received block appears valid.'
      }
    },
    pre_q5: {
      correct: 'B',
      title: 'Tracker Responsibility',
      question: 'What is the primary function of a BitTorrent "Tracker"?',
      explanation: 'Trackers serve exclusively as matchmaking servers: they register active peers and provide newly connecting clients with a list of peer IP addresses. Trackers never receive, store, or transmit the actual payload files.',
      options: {
        A: 'It stores and serves the complete binary content of the shared files to every downloading client.',
        B: 'It acts as a matchmaking server that maintains an active list of participating peer IPs and coordinates introductions.',
        C: 'It scans downloaded binary files for computer viruses before saving them to the local disk.',
        D: 'It compresses the data files into smaller archive segments prior to network transmission.'
      }
    }
  };

  // Post-test questions dictionary & explanations
  const postTestKey = {
    post_q1: {
      correct: 'B',
      title: 'Rarest-First Algorithm',
      question: 'How does the "Rarest-First" piece selection strategy optimize the health and longevity of a BitTorrent swarm?',
      explanation: 'By requesting the pieces least held across the swarm, peers prevent rare pieces from disappearing if the original seeder disconnects, ensuring complete file availability across distributed peers.',
      options: {
        A: 'It prioritizes downloading the most abundant pieces first to minimize immediate peer latency.',
        B: 'It requests pieces held by the fewest peers, preventing rare pieces from vanishing if seeders leave.',
        C: 'It forces all peers to download pieces strictly in chronological numerical order from piece 0 to N.',
        D: 'It assigns rare pieces only to peers that submit premium bandwidth cryptocurrency tokens.'
      }
    },
    post_q2: {
      correct: 'A',
      title: 'Tit-for-Tat Choking',
      question: 'Under BitTorrent\'s "Choking and Unchoking" algorithm (Tit-for-Tat), how does a peer decide which regular peers to unchoke?',
      explanation: 'Every 10 seconds, peers evaluate download throughput received from neighbors and unchoke the top 4 fastest contributors, providing direct economic incentive for peers to maximize their upload rates.',
      options: {
        A: 'It unchokes the top 4 peers that currently provide the highest inbound download transfer rates.',
        B: 'It randomly selects 4 peers every 10 seconds without regard to whether they reciprocate data.',
        C: 'It unchokes peers solely based on lowest ICMP ping latency measured during initial handshake.',
        D: 'It unchokes only peers that possess zero pieces to enforce strict egalitarian distribution.'
      }
    },
    post_q3: {
      correct: 'A',
      title: 'Optimistic Unchoking',
      question: 'What is the vital role of "Optimistic Unchoking" within the swarm?',
      explanation: 'Optimistic unchoking reserves upload bandwidth for 1 randomly selected peer every 30 seconds. This allows newcomers without pieces to bootstrap their collection, and tests whether unused peers have superior bandwidth.',
      options: {
        A: 'It enables newcomer peers with zero pieces to bootstrap their download, while probing for faster upload partners.',
        B: 'It permanently bans non-responsive leechers from reconnecting to the swarm index.',
        C: 'It overclocks TCP socket buffer windows beyond standard MTU packet boundaries.',
        D: 'It prevents the tracker from logging user IP addresses during swarm registration.'
      }
    },
    post_q4: {
      correct: 'B',
      title: 'End-Game Mode',
      question: 'Why does a BitTorrent client trigger "End-Game Mode" near completion of a download?',
      explanation: 'When only a handful of sub-blocks remain to finish a torrent, requests for those final blocks are broadcast to all unchoked peers. Whichever peer delivers the block first wins, preventing a single slow peer from stalling total completion.',
      options: {
        A: 'To disconnect all seeders immediately to save upstream Internet backbone bandwidth.',
        B: 'To broadcast redundant requests for the few remaining missing blocks to all peers, preventing slow peers from delaying completion.',
        C: 'To compress the downloaded payload into a single encrypted archive before writing to storage.',
        D: 'To fall back to an HTTP mirror server to retrieve the final 1% of the payload.'
      }
    },
    post_q5: {
      correct: 'B',
      title: 'Distributed Hash Table (DHT)',
      question: 'How does the Distributed Hash Table (DHT / Kademlia) extension support "trackerless" torrents?',
      explanation: 'DHT transforms each client into a decentralized routing node. By mapping 160-bit node IDs and infohashes using XOR distance metric, peers can locate each other without needing a centralized tracker server.',
      options: {
        A: 'It converts the torrent infohash into a centralized relational SQL database hosted by cloud providers.',
        B: 'It distributes peer discovery across participant nodes organized by cryptographic XOR distance, eliminating dependence on central trackers.',
        C: 'It completely anonymizes network traffic and obscures IP headers from internet service providers.',
        D: 'It removes the requirement for peers to verify SHA-1 checksum hashes on received pieces.'
      }
    }
  };

  // ==========================================
  // NAVIGATION & SCROLLSPY
  // ==========================================
  const navLinks = document.querySelectorAll('.nav-links-track .nav-item');
  const sections = document.querySelectorAll('main > section');

  // Handle active navigation state on scroll using IntersectionObserver fallback
  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -50% 0px',
    threshold: 0
  };

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          const isTarget = link.getAttribute('data-target') === id || link.getAttribute('href') === `#${id}`;
          link.classList.toggle('active', isTarget);
          link.setAttribute('aria-current', isTarget ? 'true' : 'false');
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => navObserver.observe(section));

  // Smooth scroll click handler
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
        // Update URL hash without jumping
        history.pushState(null, '', `#${targetId}`);
      }
    });
  });

  // Return to top button
  const returnTopBtn = document.getElementById('return-top-btn');
  if (returnTopBtn) {
    returnTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const hero = document.getElementById('network');
      if (hero) hero.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ==========================================
  // SWARM SIMULATION TOGGLE
  // ==========================================
  const swarmToggleBtn = document.getElementById('network-flow-toggle');
  const activePulseLines = document.querySelectorAll('.active-pulse-line');
  const dataPackets = document.querySelectorAll('.data-packet');
  const swarmCountDisplay = document.getElementById('live-swarm-count');

  if (swarmToggleBtn) {
    swarmToggleBtn.addEventListener('click', () => {
      state.swarmActive = !state.swarmActive;
      const pulseDot = swarmToggleBtn.querySelector('.pulse-dot');
      const btnText = swarmToggleBtn.querySelector('.btn-text');

      if (state.swarmActive) {
        pulseDot.style.backgroundColor = 'var(--color-success-green)';
        btnText.textContent = 'Swarm Active';
        activePulseLines.forEach(l => l.style.display = 'block');
        dataPackets.forEach(p => p.style.display = 'block');
        if (swarmCountDisplay) swarmCountDisplay.textContent = '3 Peers Connected (1 Seed, 2 Leechers)';
      } else {
        pulseDot.style.backgroundColor = 'var(--color-steel)';
        btnText.textContent = 'Swarm Paused';
        activePulseLines.forEach(l => l.style.display = 'none');
        dataPackets.forEach(p => p.style.display = 'none');
        if (swarmCountDisplay) swarmCountDisplay.textContent = 'Swarm Quiescent (Idle)';
      }
    });
  }

  // Peer laptop interaction
  const peerNodes = document.querySelectorAll('.laptop-device');
  peerNodes.forEach(node => {
    node.addEventListener('click', () => {
      const peerName = node.getAttribute('data-peer');
      // Highlight pulse
      node.style.transform = 'translateY(-8px) scale(1.05)';
      setTimeout(() => {
        node.style.transform = '';
      }, 350);

      if (swarmCountDisplay) {
        swarmCountDisplay.textContent = `Inspecting Peer ${peerName} · Active Bitfield Exchange`;
        setTimeout(() => {
          if (state.swarmActive && swarmCountDisplay) {
            swarmCountDisplay.textContent = '3 Peers Connected (1 Seed, 2 Leechers)';
          }
        }, 2500);
      }
    });
  });

  // ==========================================
  // SPEEDOMETER GAUGE RENDER FUNCTION
  // ==========================================
  /**
   * Renders the Apple-style speedometer gauge
   * Total arc path length is 377px (circumference of semi-circle radius 120 = π * 120 ≈ 376.99)
   * Needle rotates from -90deg (0%) to +90deg (100%)
   */
  function renderGauge(prefix, score, totalQuestions = 5) {
    const percentage = Math.round((score / totalQuestions) * 100);
    const gaugeFill = document.getElementById(`${prefix}-gauge-fill`);
    const needle = document.getElementById(`${prefix}-gauge-needle`);
    const readoutPercent = document.getElementById(`${prefix}-readout-percent`);
    const readoutRatio = document.getElementById(`${prefix}-readout-ratio`);
    const badge = document.getElementById(`${prefix}-performance-badge`);
    const feedbackTitle = document.getElementById(`${prefix}-feedback-title`);
    const feedbackDesc = document.getElementById(`${prefix}-feedback-desc`);
    const reviewToggle = document.getElementById(`${prefix}-review-toggle`);

    // Determine performance tier as specified
    let category = '';
    let badgeClass = '';
    let titleText = '';
    let descText = '';

    if (percentage >= 80) {
      category = 'STRONG';
      badgeClass = 'badge-strong';
      titleText = 'Exceptional P2P Comprehension';
      descText = `Outstanding mastery of BitTorrent architecture. You scored ${percentage}% (${score}/${totalQuestions}), successfully identifying core protocol invariants and algorithmic dynamics.`;
    } else if (percentage >= 60) {
      category = 'GOOD';
      badgeClass = 'badge-good';
      titleText = 'Solid Conceptual Understanding';
      descText = `Good performance across primary concepts. You scored ${percentage}% (${score}/${totalQuestions}). Review rarest-first piece scheduling and choking algorithms to master full swarm theory.`;
    } else if (percentage >= 40) {
      category = 'DEVELOPING';
      badgeClass = 'badge-developing';
      titleText = 'Developing Knowledge';
      descText = `Foundational concepts recognized with room for growth. You scored ${percentage}% (${score}/${totalQuestions}). Revisit the theoretical sections on swarm metadata, bitfields, and Tit-for-Tat reciprocity.`;
    } else {
      category = 'NEEDS REVIEW';
      badgeClass = 'badge-review';
      titleText = 'Conceptual Review Recommended';
      descText = `Introductory diagnostic completed. You scored ${percentage}% (${score}/${totalQuestions}). Explore the Theory sections above to build an intuitive grasp of decentralized file distribution.`;
    }

    // 1. Arc Fill Animation
    // Total stroke-dasharray = 377. At 100%, offset = 0. At 0%, offset = 377.
    const maxOffset = 377;
    const targetOffset = maxOffset - (maxOffset * (percentage / 100));
    if (gaugeFill) {
      gaugeFill.style.strokeDashoffset = targetOffset;
    }

    // 2. Needle Angle Animation: -90deg to +90deg
    const targetAngle = -90 + (percentage / 100) * 180;
    if (needle) {
      needle.style.transform = `rotate(${targetAngle}deg)`;
    }

    // 3. Score Count-Up Animation
    if (readoutPercent) {
      animateCountUp(readoutPercent, 0, percentage, 1200, '%');
    }
    if (readoutRatio) {
      readoutRatio.textContent = `Score: ${score} / ${totalQuestions}`;
    }

    // 4. Update Badge & Text
    if (badge) {
      badge.textContent = category;
      badge.className = `performance-badge ${badgeClass}`;
    }
    if (feedbackTitle) feedbackTitle.textContent = titleText;
    if (feedbackDesc) feedbackDesc.textContent = descText;

    if (reviewToggle) {
      reviewToggle.style.display = 'inline-block';
    }
  }

  function animateCountUp(element, start, end, duration, suffix = '') {
    const startTime = performance.now();
    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(start + (end - start) * eased);
      element.textContent = `${currentVal}${suffix}`;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = `${end}${suffix}`;
      }
    }
    requestAnimationFrame(step);
  }

  // ==========================================
  // PRE-TEST FORM SUBMISSION
  // ==========================================
  const preForm = document.getElementById('pre-test-form');
  const preStatusMsg = document.getElementById('pre-test-status-msg');
  const preBreakdownContainer = document.getElementById('pre-breakdown-container');
  const preReviewToggle = document.getElementById('pre-review-toggle');

  if (preForm) {
    preForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let answeredCount = 0;
      let score = 0;
      const userAnswers = {};

      for (let i = 1; i <= 5; i++) {
        const qName = `pre_q${i}`;
        const selected = preForm.querySelector(`input[name="${qName}"]:checked`);
        if (selected) {
          answeredCount++;
          userAnswers[qName] = selected.value;
          if (selected.value === preTestKey[qName].correct) {
            score++;
          }
        }
      }

      if (answeredCount < 5) {
        if (preStatusMsg) {
          preStatusMsg.textContent = `Please answer all 5 questions (${answeredCount}/5 selected).`;
        }
        return;
      }

      // Valid submission
      if (preStatusMsg) preStatusMsg.textContent = '';
      state.preTestScore = score;
      state.preTestSubmitted = true;
      state.preTestUserAnswers = userAnswers;

      // Render Speedometer
      renderGauge('pre', score, 5);

      // Build Question Breakdown
      buildBreakdown(preBreakdownContainer, preTestKey, userAnswers);

      // Smooth scroll to Pre-Test Results
      const resultsSection = document.getElementById('pre-test-results');
      if (resultsSection) {
        setTimeout(() => {
          resultsSection.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    });
  }

  if (preReviewToggle && preBreakdownContainer) {
    preReviewToggle.addEventListener('click', () => {
      const isHidden = preBreakdownContainer.style.display === 'none';
      preBreakdownContainer.style.display = isHidden ? 'flex' : 'none';
      preReviewToggle.textContent = isHidden ? 'Hide Question Breakdown' : 'Inspect Question Breakdown';
    });
  }

  // ==========================================
  // POST-TEST FORM SUBMISSION
  // ==========================================
  const postForm = document.getElementById('post-test-form');
  const postStatusMsg = document.getElementById('post-test-status-msg');
  const postBreakdownContainer = document.getElementById('post-breakdown-container');
  const postReviewToggle = document.getElementById('post-review-toggle');

  if (postForm) {
    postForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let answeredCount = 0;
      let score = 0;
      const userAnswers = {};

      for (let i = 1; i <= 5; i++) {
        const qName = `post_q${i}`;
        const selected = postForm.querySelector(`input[name="${qName}"]:checked`);
        if (selected) {
          answeredCount++;
          userAnswers[qName] = selected.value;
          if (selected.value === postTestKey[qName].correct) {
            score++;
          }
        }
      }

      if (answeredCount < 5) {
        if (postStatusMsg) {
          postStatusMsg.textContent = `Please answer all 5 questions (${answeredCount}/5 selected).`;
        }
        return;
      }

      // Valid submission
      if (postStatusMsg) postStatusMsg.textContent = '';
      state.postTestScore = score;
      state.postTestSubmitted = true;
      state.postTestUserAnswers = userAnswers;

      // Render Post-Test Speedometer
      renderGauge('post', score, 5);

      // Update Textual Understated Comparison as specified
      updateComparison(state.preTestScore, score);

      // Build Question Breakdown
      buildBreakdown(postBreakdownContainer, postTestKey, userAnswers);

      // Smooth scroll to Post-Test Results
      const postResultsSection = document.getElementById('post-test-results');
      if (postResultsSection) {
        setTimeout(() => {
          postResultsSection.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    });
  }

  if (postReviewToggle && postBreakdownContainer) {
    postReviewToggle.addEventListener('click', () => {
      const isHidden = postBreakdownContainer.style.display === 'none';
      postBreakdownContainer.style.display = isHidden ? 'flex' : 'none';
      postReviewToggle.textContent = isHidden ? 'Hide Question Breakdown' : 'Inspect Question Breakdown';
    });
  }

  // ==========================================
  // BREAKDOWN BUILDER
  // ==========================================
  function buildBreakdown(container, keyData, userChoices) {
    container.innerHTML = '';
    let index = 1;

    for (const [qKey, item] of Object.entries(keyData)) {
      const userChoice = userChoices[qKey];
      const isCorrect = userChoice === item.correct;

      const card = document.createElement('div');
      card.className = `breakdown-card ${isCorrect ? 'correct' : 'incorrect'}`;

      card.innerHTML = `
        <div class="breakdown-meta">
          <span class="b-qnum">QUESTION 0${index} · ${item.title}</span>
          <span class="b-badge ${isCorrect ? 'correct' : 'incorrect'}">
            ${isCorrect ? 'CORRECT' : 'INCORRECT'}
          </span>
        </div>
        <div class="b-question">${item.question}</div>
        <div class="b-answer">
          <strong>Your Answer:</strong> Option ${userChoice} — ${item.options[userChoice] || 'None'}
        </div>
        ${!isCorrect ? `
          <div class="b-answer" style="color: var(--color-success-green);">
            <strong>Correct Answer:</strong> Option ${item.correct} — ${item.options[item.correct]}
          </div>
        ` : ''}
        <div class="b-explanation">
          <strong>Analysis:</strong> ${item.explanation}
        </div>
      `;

      container.appendChild(card);
      index++;
    }
  }

  // ==========================================
  // UNDERSTATED COMPARISON STRIP
  // ==========================================
  function updateComparison(preScore, postScore) {
    const compPreVal = document.getElementById('comp-pre-val');
    const compPostVal = document.getElementById('comp-post-val');
    const compDeltaVal = document.getElementById('comp-delta-val');

    const postPercent = Math.round((postScore / 5) * 100);
    if (compPostVal) compPostVal.textContent = `${postPercent}%`;

    if (preScore !== null) {
      const prePercent = Math.round((preScore / 5) * 100);
      const delta = postPercent - prePercent;

      if (compPreVal) compPreVal.textContent = `${prePercent}%`;
      if (compDeltaVal) {
        if (delta > 0) {
          compDeltaVal.textContent = `+${delta}% GAIN`;
          compDeltaVal.style.color = 'var(--color-success-green)';
        } else if (delta === 0) {
          compDeltaVal.textContent = 'CONSISTENT';
          compDeltaVal.style.color = 'var(--color-slate)';
        } else {
          compDeltaVal.textContent = `${delta}%`;
          compDeltaVal.style.color = 'var(--color-error-red)';
        }
      }
    } else {
      if (compPreVal) compPreVal.textContent = 'N/A';
      if (compDeltaVal) compDeltaVal.textContent = 'INITIAL';
    }
  }

});
