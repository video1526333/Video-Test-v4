document.addEventListener('DOMContentLoaded', () => {
    // Use a public CORS proxy instead of a local server
    const apiUrl = 'https://api.yzzy-api.com/inc/api_mac10.php';
    // Cors proxies options (if one fails, will try the next)
    const corsProxies = [
        'https://corsproxy.io/?',                         // Working proxy - first option
        'https://cors.eu.org/',                           // Option 2
        'https://thingproxy.freeboard.io/fetch/?url=',    // Option 3
        'https://api.allorigins.win/raw?url=',            // Option 4
        'https://api.allorigins.cf/raw?url=',             // Option 5
        'https://api.allorigins.tk/raw?url=',             // Option 6
        'https://api.codetabs.com/v1/proxy?quest=',       // Option 7
        'https://yacdn.org/proxy/',                       // Option 8
        'https://cors.bridged.cc/',                       // Option 9
        'https://cors.sho.sh/',                           // Option 10
        'https://cors.ironproxy.xyz/',                    // Option 11
        'https://norobe-cors-anywhere.herokuapp.com/',    // Option 12
        'https://corsproxy.github.io/?url=',              // Option 13
        'https://cors-proxy.elfsight.com/',               // Option 14 (failing)
        ''                                                // Direct API (may not work due to CORS)
    ];
    let currentProxyIndex = 0; // Start with the first proxy
    const categoryList = document.getElementById('categoryList');
    const videoGrid = document.getElementById('videoGrid');
    const pagination = document.getElementById('pagination');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const categoryNav = document.getElementById('categoryNav');

    // Settings elements
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsButton = settingsModal.querySelector('.close-button');
    const passwordInput = document.getElementById('passwordInput');
    const submitPasswordButton = document.getElementById('submitPassword');
    const passwordMessage = document.getElementById('passwordMessage');

    // Share elements
    const shareButton = document.getElementById('shareButton');
    const shareModal = document.getElementById('shareModal');
    const closeShareButton = shareModal.querySelector('.close-button');
    const shareLinkInput = document.getElementById('shareLink');
    const copyLinkButton = document.getElementById('copyLinkButton');
    
    // Watchlist elements
    const addToWatchListButton = document.getElementById('addToWatchListButton');
    const mobileWatchListButton = document.getElementById('mobileWatchListButton');
    const exportWatchListButton = document.getElementById('exportWatchListButton');
    const importWatchListInput = document.getElementById('importWatchListInput');
    const importWatchListButton = document.getElementById('importWatchListButton');
    
    // Current video ID (for sharing)
    let currentVideoId = null;
    // Watch list storage in localStorage
    let watchList = JSON.parse(localStorage.getItem('watchList') || '[]');

    // Password configuration
    const correctPassword = '12345678';
    
    // Check if password is stored in localStorage
    const checkStoredPassword = () => {
        const isAuthenticated = localStorage.getItem('authenticated') === 'true';
        if (isAuthenticated) {
            categoryNav.classList.add('visible');
        }
        return isAuthenticated;
    };

    // Show the category bar by default (even when not authenticated)
    // But will still restrict which categories are shown
    categoryNav.classList.add('visible');

    // Default category ID - Set to 16 for "香港剧"
    const defaultCategoryId = "16";
    // Second restricted category ID - 13 
    const secondRestrictedCategoryId = "13";
    // Array of restricted category IDs to show when not authenticated
    const restrictedCategoryIds = [defaultCategoryId, secondRestrictedCategoryId];

    // Modal elements
    const modal = document.getElementById('videoDetailModal');
    const closeModalButton = modal.querySelector('.close-button');
    const modalTitle = document.getElementById('modalTitle');
    const modalPoster = document.getElementById('modalPoster');
    const modalYear = document.getElementById('modalYear');
    const modalArea = document.getElementById('modalArea');
    const modalLang = document.getElementById('modalLang');
    const modalDirector = document.getElementById('modalDirector');
    const modalActors = document.getElementById('modalActors');
    const modalRemarks = document.getElementById('modalRemarks');
    const modalDescription = document.getElementById('modalDescription');
    const modalEpisodes = document.getElementById('modalEpisodes');
    
    // Video player modal elements
    const videoPlayerModal = document.getElementById('videoPlayerModal');
    const closeVideoPlayerButton = videoPlayerModal.querySelector('.close-button');
    const videoPlayer = document.getElementById('videoPlayer');
    const playingTitle = document.getElementById('playingTitle');
    let videojsPlayer = null;
    let hlsPlayer = null;

    let currentPage = 1;
    let currentCategory = ''; // Store category ID
    let currentSearch = ''; // Store search term
    let totalPages = 1;
    let isLoading = false; // Flag to prevent multiple simultaneous loads
    let hasMoreContent = true; // Flag to track if more content is available

    const toastContainer = document.getElementById('toastContainer');

    // Create back to top button
    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'backToTop';
    backToTopBtn.innerHTML = '&uarr;';
    backToTopBtn.title = 'Back to Top';
    document.body.appendChild(backToTopBtn);

    /**
     * Show a toast notification
     * @param {string} message - Text to display
     * @param {string} type - 'error' or 'info'
     * @param {number} duration - millisecs to display
     */
    function showToast(message, type = 'info', duration = 4000) {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        // force reflow for transition
        requestAnimationFrame(() => toast.classList.add('show'));
        // remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            });
        }, duration);
    }

    // --- Helper Functions ---
    function showLoading() {
        loadingIndicator.style.display = 'block';
        isLoading = true;
    }

    function hideLoading() {
        loadingIndicator.style.display = 'none';
        isLoading = false;
    }

    async function fetchData(params, silent = false) {
        if (!silent) showLoading();
        // Build query string
        const queryParams = new URLSearchParams(params).toString();
        const targetUrl = `${apiUrl}?${queryParams}`;
        
        // Track original proxy index to avoid infinite loop
        const originalProxyIndex = currentProxyIndex;
        let proxyAttempts = 0;
        let success = false;
        let responseData = null;

        // Try up to all available proxies
        while (!success && proxyAttempts < corsProxies.length) {
            // Use the current proxy
            const proxyUrl = corsProxies[currentProxyIndex] + encodeURIComponent(targetUrl);
            
            try {
                console.log(`Fetching via CORS proxy ${currentProxyIndex + 1}: ${proxyUrl}`);
                console.log('Request params:', params);
                
                const response = await fetch(proxyUrl);
                
                // Handle HTTP error status (including 404)
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Check for valid API response
                if (data.code !== 1) {
                    console.error('API Error:', data.msg);
                    throw new Error(`API Error: ${data.msg}`);
                }
                
                // Success! We have valid data
                success = true;
                responseData = data;
                console.log('API Response:', data);
                
            } catch (error) {
                console.error(`Fetch Error with proxy ${currentProxyIndex + 1}:`, error);
                
                // Move to the next proxy
                currentProxyIndex = (currentProxyIndex + 1) % corsProxies.length;
                proxyAttempts++;
                
                // Show toast only on the last attempt
                if (proxyAttempts >= corsProxies.length) {
                    showToast(`Failed to fetch data after trying all CORS proxies: ${error.message}`, 'error');
                } else {
                    showToast(`Switching to CORS proxy ${currentProxyIndex + 1}...`, 'info', 1500);
                }
            }
        }
        
        if (!silent) hideLoading();
        return responseData; // Will be null if all proxies failed
    }

    // --- Core Functions ---

    async function loadCategories() {
        // Fetch any list page to get categories (they are included in list responses)
        const data = await fetchData({ ac: 'list', pg: 1 });
        if (!data || !data.class) {
             console.error("Could not load categories.");
             return;
         }

        // Clear previous categories
        categoryList.innerHTML = '';
        
        // Check if user is authenticated
        const isAuthenticated = checkStoredPassword();
        
        // Only add "All" option if authenticated
        if (isAuthenticated) {
            const allLi = document.createElement('li');
            allLi.textContent = 'All';
            allLi.dataset.id = '';
            categoryList.appendChild(allLi);
        }
        
        data.class.forEach(cat => {
            // Sometimes type_name can be null, handle it
            if (cat.type_name) {
                // If not authenticated, only show restricted categories (16 and 13)
                if (!isAuthenticated && !restrictedCategoryIds.includes(cat.type_id)) {
                    return; // Skip this category
                }
                
                const li = document.createElement('li');
                li.textContent = cat.type_name;
                li.dataset.id = cat.type_id;
                // Set the default category as active
                if (cat.type_id === defaultCategoryId) {
                    li.classList.add('active');
                }
                categoryList.appendChild(li);
            } else {
                console.warn(`Category ID ${cat.type_id} has null name.`);
            }
        });
        // Add Watch List option at end of categories
        const watchLi = document.createElement('li');
        watchLi.textContent = 'Watch List';
        watchLi.dataset.id = 'watchlist';
        categoryList.appendChild(watchLi);
    }

    // Function to handle image URLs more robustly
    function getValidImageUrl(imageUrl) {
        if (!imageUrl) return null;
        
        // If it already starts with http/https, use it
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }
        
        // If it's a relative URL (starts with /), add domain
        if (imageUrl.startsWith('/')) {
            return 'https://pic3.yzzyimg.online' + imageUrl;
        }
        
        // Try to parse URLs that might be missing protocol
        if (imageUrl.startsWith('pic1.') || 
            imageUrl.startsWith('pic2.') || 
            imageUrl.startsWith('pic3.') || 
            imageUrl.startsWith('yzzyimg.')) {
            return 'https://' + imageUrl;
        }
        
        return null;
    }

    async function loadVideos(page = 1, categoryId = '', searchTerm = '', append = false) {
        if (isLoading || (!append && page > 1 && !hasMoreContent)) return;
        
        currentPage = page;
        if (!append) {
            currentCategory = categoryId;
            currentSearch = searchTerm;
            hasMoreContent = true;
        }

        const params = { ac: 'list', pg: currentPage };
        
        // Only add category if it's not empty
        if (currentCategory) {
            params.t = currentCategory;
        }
        
        // Only add search term if it's not empty
        if (currentSearch) {
            params.wd = encodeURIComponent(currentSearch);
            console.log(`Search term encoded: ${params.wd}`);
        }

        // Show info to user
        if (currentSearch && !append) {
            showToast(`Searching for "${currentSearch}"...`, 'info', 2000);
        }

        const data = await fetchData(params);
        if (!data || !data.list) {
            if (!append) {
                videoGrid.innerHTML = '<p>No videos found or failed to load.</p>';
            }
            hasMoreContent = false;
            return; // Stop execution if data is invalid
        }

        if (!append) {
            videoGrid.innerHTML = ''; // Clear previous videos only if not appending
        }
        
        if (data.list.length === 0) {
            if (!append) {
                if (currentSearch) {
                    videoGrid.innerHTML = `<p>No videos found for "${currentSearch}".</p>`;
                } else {
                    videoGrid.innerHTML = '<p>No videos found for this category.</p>';
                }
            }
            hasMoreContent = false;
        } else {
            data.list.forEach(video => {
                const card = document.createElement('div');
                card.className = 'video-card';
                card.dataset.id = video.vod_id;

                const img = document.createElement('img');
                // Use more robust image URL handling
                const validImageUrl = getValidImageUrl(video.vod_pic);
                img.src = validImageUrl || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22150%22%20height%3D%22225%22%20viewBox%3D%220%200%20150%20225%22%3E%3Crect%20fill%3D%22%23ddd%22%20width%3D%22150%22%20height%3D%22225%22%2F%3E%3Ctext%20fill%3D%22%23666%22%20font-family%3D%22sans-serif%22%20font-size%3D%2216%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
                img.alt = video.vod_name;
                img.onerror = () => { // Handle image loading errors
                   img.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22150%22%20height%3D%22225%22%20viewBox%3D%220%200%20150%20225%22%3E%3Crect%20fill%3D%22%23ddd%22%20width%3D%22150%22%20height%3D%22225%22%2F%3E%3Ctext%20fill%3D%22%23666%22%20font-family%3D%22sans-serif%22%20font-size%3D%2216%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E'; // Fallback placeholder
                }

                // If list API had no valid image, fetch detail API to get the real thumbnail
                if (!validImageUrl) {
                    fetchData({ ac: 'detail', ids: video.vod_id }, true)
                        .then(detailData => {
                            if (detailData && detailData.list && detailData.list[0]?.vod_pic) {
                                const detailImg = getValidImageUrl(detailData.list[0].vod_pic);
                                if (detailImg) img.src = detailImg;
                            }
                        })
                        .catch(err => console.warn('Failed to fetch detail image:', err));
                }

                const title = document.createElement('h3');
                title.textContent = video.vod_name || 'No Title'; // Handle null titles

                const remarks = document.createElement('p');
                remarks.textContent = video.vod_remarks || ''; // Handle null remarks

                card.appendChild(img);
                card.appendChild(title);
                card.appendChild(remarks);
                videoGrid.appendChild(card);
            });
            
            // Show results count for initial search
            if (currentSearch && !append) {
                showToast(`Found ${data.list.length} video(s) for "${currentSearch}"`, 'info', 3000);
            }
        }

        totalPages = data.pagecount || 1;
        if (currentPage >= totalPages) {
            hasMoreContent = false;
        }
    }

    // Check if user scrolled near bottom
    function checkScroll() {
        if (isLoading || !hasMoreContent) return;
        
        const scrollPosition = window.innerHeight + window.scrollY;
        const pageHeight = document.body.offsetHeight;
        const scrollThreshold = 0.8; // Load more when user scrolls to 80% of the page
        
        // Show/hide back to top button
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
        
        // If user has scrolled to threshold and there's more content
        if (scrollPosition / pageHeight > scrollThreshold && hasMoreContent) {
            loadVideos(currentPage + 1, currentCategory, currentSearch, true);
        }
    }

    async function showVideoDetails(videoId) {
         const data = await fetchData({ ac: 'detail', ids: videoId });
         if (!data || !data.list || data.list.length === 0) {
             showToast('Failed to load video details.', 'error');
             return;
         }

         const video = data.list[0]; // Assuming the first item is the one we want
         
         // Store the current video ID for sharing
         currentVideoId = videoId;
         // Update Watch List button text based on storage
         addToWatchListButton.textContent = watchList.includes(currentVideoId) ? 'Remove from Watch List' : 'Add to Watch List';

         modalTitle.textContent = video.vod_name || 'No Title';
         // Use more robust image URL handling
         const validImageUrl = getValidImageUrl(video.vod_pic);
         modalPoster.src = validImageUrl || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22300%22%20viewBox%3D%220%200%20200%20300%22%3E%3Crect%20fill%3D%22%23ddd%22%20width%3D%22200%22%20height%3D%22300%22%2F%3E%3Ctext%20fill%3D%22%23666%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
         modalPoster.onerror = () => {
             modalPoster.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22300%22%20viewBox%3D%220%200%20200%20300%22%3E%3Crect%20fill%3D%22%23ddd%22%20width%3D%22200%22%20height%3D%22300%22%2F%3E%3Ctext%20fill%3D%22%23666%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
         }
         modalYear.textContent = video.vod_year || 'N/A';
         modalArea.textContent = video.vod_area || 'N/A';
         modalLang.textContent = video.vod_lang || 'N/A';
         modalDirector.textContent = video.vod_director || 'N/A';
         modalActors.textContent = video.vod_actor || 'N/A';
         modalRemarks.textContent = video.vod_remark || 'N/A';
         // Use innerHTML for description in case it contains basic HTML
         modalDescription.innerHTML = video.vod_content || 'No description available.';

         // Reset the video player
         if (videojsPlayer) {
             videojsPlayer.dispose();
             videojsPlayer = null;
         }

         // Parse and display episodes
         modalEpisodes.innerHTML = ''; // Clear previous episodes
         if (video.vod_play_url) {
             // The format seems to be Name1$URL1#Name2$URL2...
             const playSources = video.vod_play_url.split('#');
             
             playSources.forEach(source => {
                 const parts = source.split('$');
                 if (parts.length === 2) {
                     const name = parts[0];
                     const url = parts[1];
                     
                     // Check if it's an m3u8 URL
                     if (url && url.startsWith('http')) {
                         const isM3u8 = url.includes('.m3u8');
                         const link = document.createElement('a');
                         link.href = 'javascript:void(0)'; // Use JavaScript instead of direct link
                         link.textContent = name || 'Play';
                         link.dataset.url = url;
                         link.dataset.name = name || 'Episode';
                         
                         // If this is an m3u8 link, set up the event handler
                         if (isM3u8) {
                             link.addEventListener('click', function(e) {
                                 e.preventDefault();
                                 playM3u8Video(url, this);
                             });
                         } else {
                             // For non-m3u8 links, we'll still open in a new tab
                             link.target = '_blank';
                             link.href = url;
                         }
                         
                         modalEpisodes.appendChild(link);
                     } else {
                         console.warn(`Invalid episode URL found: ${url}`);
                     }
                 }
             });
         } else {
             modalEpisodes.textContent = 'No playback sources available.';
         }

         // Update browser history to allow direct linking
         updateBrowserHistory(videoId, video.vod_name);

         modal.classList.add('open'); // Show the modal via CSS class
     }
     
     /**
      * Update the browser URL without reloading the page
      * @param {string} videoId - The video ID
      * @param {string} videoTitle - The video title for the page title
      */
     function updateBrowserHistory(videoId, videoTitle) {
         // Only update if browser supports history API
         if (window.history && window.history.pushState) {
             const url = new URL(window.location);
             url.searchParams.set('video', videoId);
             window.history.pushState({ videoId }, videoTitle, url);
             // Update page title
             document.title = videoTitle ? `${videoTitle} - Video Portal` : 'Video Portal';
         }
     }

     /**
      * Show the share modal with link to current video
      */
     function showShareModal() {
         if (!currentVideoId) {
             showToast('No video selected to share', 'error');
             return;
         }
         
         // Generate a full URL to the current video
         const url = new URL(window.location.href);
         // Clear any existing parameters
         url.search = '';
         // Set the video parameter
         url.searchParams.set('video', currentVideoId);
         
         // Update the share link input
         shareLinkInput.value = url.href;
         
         // Show the modal
         shareModal.classList.add('open');
         
         // Select the text for easy copying
         shareLinkInput.select();
     }
     
     /**
      * Copy the share link to clipboard
      */
     function copyShareLink() {
         // Select the link text
         shareLinkInput.select();
         shareLinkInput.setSelectionRange(0, 99999); // For mobile devices
         
         // Copy to clipboard
         try {
             // Use the newer clipboard API if available
             if (navigator.clipboard) {
                 navigator.clipboard.writeText(shareLinkInput.value)
                     .then(() => {
                         showToast('Link copied to clipboard!', 'info');
                     })
                     .catch(err => {
                         console.error('Failed to copy link: ', err);
                         // Fallback to the older method
                         document.execCommand('copy');
                         showToast('Link copied to clipboard!', 'info');
                     });
             } else {
                 // Fallback for older browsers
                 document.execCommand('copy');
                 showToast('Link copied to clipboard!', 'info');
             }
         } catch (err) {
             console.error('Failed to copy link: ', err);
             showToast('Failed to copy link. Please select and copy manually.', 'error');
         }
     }
     
     // Function to play m3u8 videos
     function playM3u8Video(url, linkElement) {
         // Reset active statuses
         const allLinks = modalEpisodes.querySelectorAll('a');
         allLinks.forEach(link => link.classList.remove('active'));
         if (linkElement) {
             linkElement.classList.add('active');
             playingTitle.textContent = `Now Playing: ${linkElement.dataset.name}`;
         }
         // Show player modal
         videoPlayerModal.classList.add('open');

         // Clean up any previous HLS instance
         if (hlsPlayer) { hlsPlayer.destroy(); hlsPlayer = null; }
         videoPlayer.style.display = 'block';

         // Simplified HLS playback
         if (Hls.isSupported()) {
             hlsPlayer = new Hls();
             hlsPlayer.loadSource(url);
             hlsPlayer.attachMedia(videoPlayer);
         } else {
             // Native HLS (Safari)
             videoPlayer.src = url;
         }
         videoPlayer.play().catch(e => console.error('Playback error:', e));
     }

    // --- Event Listeners ---

    // Back to top button click
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Scroll event for infinite loading and back to top button
    window.addEventListener('scroll', checkScroll);

    // Category selection
    categoryList.addEventListener('click', (event) => {
        if (event.target.tagName === 'LI') {
            // Remove active class from previously selected item
            const currentActive = categoryList.querySelector('.active');
            if (currentActive) {
                currentActive.classList.remove('active');
            }
            // Add active class to clicked item
            event.target.classList.add('active');

            const categoryId = event.target.dataset.id;
            searchInput.value = ''; // Clear search input when changing categories
            if (categoryId === 'watchlist') {
                loadWatchList();
            } else {
                loadVideos(1, categoryId, '');
            }
            
            // Scroll to top when changing categories
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // Search
    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            console.log(`Searching for: "${searchTerm}"`);
            // Reset any active category when searching
            const currentActive = categoryList.querySelector('.active');
            if (currentActive) {
                currentActive.classList.remove('active');
            }
            categoryList.querySelector('li[data-id=""]').classList.add('active');
            
            loadVideos(1, '', searchTerm); // Load page 1, clear category, use search term
            
            // Scroll to top for new search
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            showToast('Please enter a search term', 'info');
        }
    });

    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchButton.click(); // Trigger search on Enter key
        }
    });

    // Video card click
    videoGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.video-card');
        if (card) {
            const videoId = card.dataset.id;
            showVideoDetails(videoId);
        }
    });

    // Modal close
    closeModalButton.addEventListener('click', () => {
        modal.classList.remove('open');
        // Stop the video if playing
        if (videojsPlayer) {
            videojsPlayer.dispose();
            videojsPlayer = null;
        }
        videoPlayer.pause();
        if (hlsPlayer) { hlsPlayer.destroy(); hlsPlayer = null; }
        // Reset page title and URL when closing the modal
        document.title = 'Video Portal';
        // Only update if browser supports history API
        if (window.history && window.history.pushState) {
            const url = new URL(window.location);
            url.searchParams.delete('video');
            window.history.pushState({}, 'Video Portal', url);
        }
    });

    // Video player modal close
    closeVideoPlayerButton.addEventListener('click', () => {
        videoPlayerModal.classList.remove('open');
        // Stop the video
        if (videojsPlayer) {
            videojsPlayer.dispose();
            videojsPlayer = null;
        }
        videoPlayer.pause();
        if (hlsPlayer) { hlsPlayer.destroy(); hlsPlayer = null; }
    });

    // Share button click
    shareButton.addEventListener('click', showShareModal);
    
    // Copy link button click
    copyLinkButton.addEventListener('click', copyShareLink);
    
    // Close share modal
    closeShareButton.addEventListener('click', () => {
        shareModal.classList.remove('open');
    });

    // Handle popstate (browser back/forward buttons)
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.videoId) {
            // User navigated back to a video detail page
            showVideoDetails(event.state.videoId);
        } else {
            // User navigated back to the main page
            modal.classList.remove('open');
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) { // Close if clicked outside the modal content
            modal.classList.remove('open');
        }
        if (event.target === videoPlayerModal) { // Close if clicked outside the video player modal content
            videoPlayerModal.classList.remove('open');
            // Stop the video
            if (videojsPlayer) {
                videojsPlayer.dispose();
                videojsPlayer = null;
            }
            videoPlayer.pause();
            if (hlsPlayer) { hlsPlayer.destroy(); hlsPlayer = null; }
        }
        if (event.target === settingsModal) { // Close settings modal if clicked outside
            settingsModal.classList.remove('open');
        }
        if (event.target === shareModal) { // Close share modal if clicked outside
            shareModal.classList.remove('open');
        }
    });

    // --- Settings functionality ---
    settingsButton.addEventListener('click', () => {
        settingsModal.classList.add('open');
    });

    closeSettingsButton.addEventListener('click', () => {
        settingsModal.classList.remove('open');
    });

    submitPasswordButton.addEventListener('click', validatePassword);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            validatePassword();
        }
    });

    function validatePassword() {
        const password = passwordInput.value;
        
        if (password === correctPassword) {
            // Show success message
            passwordMessage.textContent = 'Password correct!';
            passwordMessage.className = 'success';
            
            // Show category nav
            categoryNav.classList.add('visible');
            
            // Store authentication in localStorage
            localStorage.setItem('authenticated', 'true');
            
            // Reload categories to show all of them
            loadCategories();
            
            // Close modal after short delay
            setTimeout(() => {
                settingsModal.classList.remove('open');
                passwordInput.value = ''; // Clear password field
                passwordMessage.textContent = '';
            }, 1500);
        } else {
            // Show error message
            passwordMessage.textContent = 'Incorrect password. Try again.';
            passwordMessage.className = '';
            passwordInput.value = ''; // Clear password field
        }
    }

    // --- Initial Load ---
    async function initialize() {
        await loadCategories(); // Load categories first
        // Clear any existing active categories
        const activeItems = categoryList.querySelectorAll('li.active');
        activeItems.forEach(li => li.classList.remove('active'));  
        // Default load: show watch list
        const watchLi = categoryList.querySelector('li[data-id="watchlist"]');
        if (watchLi) {
            watchLi.classList.add('active');
        }
        loadWatchList();

        // Check if user is already authenticated
        checkStoredPassword();
        // Check if we should load a specific video (from shared link)
        checkForSharedVideo();
    }

    // --- Check for shared video in URL ---
    function checkForSharedVideo() {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('video');
        
        if (videoId) {
            // We have a video ID in the URL, need to load that specific video
            showVideoDetails(videoId);
        }
    }

    // --- Watch List Functions ---
    async function loadWatchList() {
        // Render saved videos from watchList
        videoGrid.innerHTML = '';
        if (watchList.length === 0) {
            videoGrid.innerHTML = '<p>No videos in your watch list.</p>';
            return;
        }
        showToast('Loading your watch list...', 'info');
        const ids = watchList.join(',');
        const data = await fetchData({ ac: 'detail', ids: ids });
        if (!data || !data.list) {
            videoGrid.innerHTML = '<p>Failed to load watch list.</p>';
            return;
        }
        data.list.forEach(video => {
            const card = document.createElement('div');
            card.className = 'video-card';
            card.dataset.id = video.vod_id;
            const img = document.createElement('img');
            const validImageUrl = getValidImageUrl(video.vod_pic);
            img.src = validImageUrl || '';
            img.alt = video.vod_name || 'No Image';
            const title = document.createElement('h3');
            title.textContent = video.vod_name || 'No Title';
            const remarks = document.createElement('p');
            remarks.textContent = video.vod_remarks || '';
            card.appendChild(img);
            card.appendChild(title);
            card.appendChild(remarks);
            videoGrid.appendChild(card);
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function toggleWatchList() {
        if (!currentVideoId) return;
        const idx = watchList.indexOf(currentVideoId);
        if (idx === -1) {
            watchList.push(currentVideoId);
            showToast('Added to watch list', 'info');
        } else {
            watchList.splice(idx, 1);
            showToast('Removed from watch list', 'info');
        }
        localStorage.setItem('watchList', JSON.stringify(watchList));
        addToWatchListButton.textContent = watchList.includes(currentVideoId) ? 'Remove from Watch List' : 'Add to Watch List';
    }
    // Event listeners for Watch List buttons
    addToWatchListButton.addEventListener('click', toggleWatchList);
    mobileWatchListButton.addEventListener('click', () => {
        const currentActive = categoryList.querySelector('.active');
        if (currentActive) currentActive.classList.remove('active');
        loadWatchList();
    });
    exportWatchListButton.addEventListener('click', exportWatchList);
    importWatchListButton.addEventListener('click', () => importWatchListInput.click());
    importWatchListInput.addEventListener('change', handleImportWatchList);

    // Export watch list to JSON
    function exportWatchList() {
        const dataStr = JSON.stringify(watchList, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'watchList.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Handle importing watch list from JSON file
    function handleImportWatchList(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedList = JSON.parse(e.target.result);
                if (!Array.isArray(importedList)) throw new Error('Invalid watch list format');
                watchList = importedList;
                localStorage.setItem('watchList', JSON.stringify(watchList));
                showToast('Watch list imported successfully', 'info');
                const active = categoryList.querySelector('li.active');
                if (active && active.dataset.id === 'watchlist') {
                    loadWatchList();
                }
                settingsModal.classList.remove('open');
            } catch (err) {
                console.error(err);
                showToast('Failed to import watch list', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    initialize();

    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Adjust path for GitHub Pages subdirectory
            navigator.serviceWorker.register('/Video-Test-v2/sw.js') 
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }

}); 