import puppeteer from 'puppeteer';
import logger from '../../utils/logger.js';

class ProfileScraper {
  constructor() {
    this.browser = null;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async scrapeLinkedIn(url) {
    try {
      await this.init();
      const page = await this.browser.newPage();
      await page.setUserAgent(this.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for content to load
      await page.waitForTimeout(2000);

      const profileData = await page.evaluate(() => {
        const data = {
          name: '',
          title: '',
          company: '',
          location: '',
          bio: '',
          connections: '',
          posts: []
        };

        // Extract name
        const nameEl = document.querySelector('h1.text-heading-xlarge');
        if (nameEl) data.name = nameEl.textContent.trim();

        // Extract title
        const titleEl = document.querySelector('.text-body-medium.break-words');
        if (titleEl) data.title = titleEl.textContent.trim();

        // Extract location
        const locationEl = document.querySelector('.text-body-small.inline.t-black--light.break-words');
        if (locationEl) data.location = locationEl.textContent.trim();

        // Extract about/bio
        const aboutEl = document.querySelector('#about ~ .display-flex .text-body-medium');
        if (aboutEl) data.bio = aboutEl.textContent.trim();

        // Extract recent posts (simplified)
        const postElements = document.querySelectorAll('.feed-shared-update-v2');
        postElements.forEach((post, index) => {
          if (index < 5) {
            const textEl = post.querySelector('.feed-shared-text');
            if (textEl) {
              data.posts.push({
                content: textEl.textContent.trim(),
                timestamp: new Date().toISOString()
              });
            }
          }
        });

        return data;
      });

      await page.close();
      return profileData;
    } catch (error) {
      logger.error(`LinkedIn scraping error for ${url}: ${error.message}`);
      throw error;
    }
  }

  async scrapeTwitter(url) {
    try {
      await this.init();
      const page = await this.browser.newPage();
      await page.setUserAgent(this.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(2000);

      const profileData = await page.evaluate(() => {
        const data = {
          name: '',
          handle: '',
          bio: '',
          followers: '',
          following: '',
          posts: []
        };

        // Extract name
        const nameEl = document.querySelector('[data-testid="UserName"]');
        if (nameEl) data.name = nameEl.textContent.trim();

        // Extract handle
        const handleEl = document.querySelector('[data-testid="UserName"] + span');
        if (handleEl) data.handle = handleEl.textContent.trim();

        // Extract bio
        const bioEl = document.querySelector('[data-testid="UserDescription"]');
        if (bioEl) data.bio = bioEl.textContent.trim();

        // Extract follower count
        const followerEl = document.querySelector('a[href*="/followers"]');
        if (followerEl) data.followers = followerEl.textContent.trim();

        // Extract recent tweets
        const tweetElements = document.querySelectorAll('[data-testid="tweet"]');
        tweetElements.forEach((tweet, index) => {
          if (index < 10) {
            const textEl = tweet.querySelector('[data-testid="tweetText"]');
            if (textEl) {
              data.posts.push({
                content: textEl.textContent.trim(),
                timestamp: new Date().toISOString()
              });
            }
          }
        });

        return data;
      });

      await page.close();
      return profileData;
    } catch (error) {
      logger.error(`Twitter scraping error for ${url}: ${error.message}`);
      throw error;
    }
  }

  async scrapeProfile(url, platform) {
    try {
      switch (platform.toLowerCase()) {
        case 'linkedin':
          return await this.scrapeLinkedIn(url);
        case 'twitter':
          return await this.scrapeTwitter(url);
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      logger.error(`Profile scraping error: ${error.message}`);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default new ProfileScraper();

