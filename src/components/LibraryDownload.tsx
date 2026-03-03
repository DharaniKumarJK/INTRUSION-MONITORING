import { Download } from 'lucide-react';

export function LibraryDownload() {
  const generateLibrary = () => {
    const libraryCode = `/**
 * Security Monitor Library
 * Track login attempts and detect bypass attempts
 * Version 1.0.0
 */

class SecurityMonitor {
  constructor(config = {}) {
    this.apiEndpoint = config.apiEndpoint || 'http://localhost:8000/login-attempts';
    this.websiteDomain = config.websiteDomain || window.location.hostname;
  }

  async trackLoginAttempt(options) {
    const {
      attemptedUsername,
      actualUsername = null,
      attemptSuccess = false
    } = options;

    try {
      const data = {
        attempted_username: attemptedUsername,
        actual_username: actualUsername,
        attempt_success: attemptSuccess,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        website_domain: this.websiteDomain
      };

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.bypass_detected) {
        console.warn('Security Monitor: Bypass attempt detected!', result);
      }

      return result;
    } catch (error) {
      console.error('Security Monitor Error:', error);
      return { success: false, error: error.message };
    }
  }

  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return null;
    }
  }

  wrapLoginForm(formElement, options = {}) {
    const {
      usernameField = 'username',
      passwordField = 'password',
      onSuccess = null,
      onFailure = null
    } = options;

    formElement.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(formElement);
      const attemptedUsername = formData.get(usernameField);

      const trackingPromise = this.trackLoginAttempt({
        attemptedUsername,
        attemptSuccess: false
      });

      if (onFailure) {
        trackingPromise.then(() => {
          onFailure(attemptedUsername);
        });
      }
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityMonitor;
}

if (typeof window !== 'undefined') {
  window.SecurityMonitor = SecurityMonitor;
}
`;

    return libraryCode;
  };

  const handleDownload = () => {
    const libraryCode = generateLibrary();
    const blob = new Blob([libraryCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'security-monitor.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Download Library</h2>
      <p className="text-gray-600 mb-6">
        Download the Security Monitor library to integrate into your website's login page.
      </p>

      <button
        onClick={handleDownload}
        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        <Download className="w-5 h-5" />
        Download security-monitor.js
      </button>

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Usage Instructions:</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p className="font-mono bg-gray-100 p-2 rounded">
            {'<script src="security-monitor.js"></script>'}
          </p>
          <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-xs">
            {`const monitor = new SecurityMonitor({
  websiteDomain: 'yourwebsite.com'
});

// Track a login attempt
await monitor.trackLoginAttempt({
  attemptedUsername: 'us3r@example.com',
  actualUsername: 'user@example.com',
  attemptSuccess: false
});

// Or wrap your login form
monitor.wrapLoginForm(
  document.getElementById('loginForm'),
  {
    usernameField: 'email',
    passwordField: 'password'
  }
);`}
          </pre>
        </div>
      </div>
    </div>
  );
}
