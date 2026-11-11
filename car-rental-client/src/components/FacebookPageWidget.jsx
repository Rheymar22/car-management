import { useEffect, useRef, useState } from 'react'

const FB_PAGE_URL = 'https://www.facebook.com/mrpatcarrentalservice'
const FB_SDK_VERSION = 'v21.0'

export default function FacebookPageWidget({
  pageUrl = FB_PAGE_URL,
  tabs = 'timeline',
  height = 500,
  smallHeader = false,
  showFacepile = true,
  hideCover = false,
}) {
  const containerRef = useRef(null)
  const loadedRef = useRef(false) // live flag, unaffected by stale closures
  const [loadFailed, setLoadFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    const failTimer = setTimeout(() => {
      // Check the ref (always current), not the `loaded` state variable
      // (which would be captured as stale — permanently `false` — inside
      // this closure, causing the fallback to fire even after success).
      if (!cancelled && !loadedRef.current) setLoadFailed(true)
    }, 6000)

    function renderWidget() {
      if (window.FB && window.FB.XFBML) {
        window.FB.XFBML.parse(containerRef.current)
        loadedRef.current = true
        clearTimeout(failTimer)
        if (!cancelled) setLoaded(true)
      }
    }

    // Facebook's SDK needs a #fb-root element to exist somewhere on the page
    if (!document.getElementById('fb-root')) {
      const root = document.createElement('div')
      root.id = 'fb-root'
      document.body.prepend(root)
    }

    if (window.FB) {
      renderWidget()
    } else {
      const existing = document.getElementById('facebook-jssdk')
      if (existing) {
        // The script may have already finished loading before this effect
        // ran (its 'load' event could have already fired once). Check
        // window.FB directly as well as listening, so we don't miss it.
        if (window.FB) {
          renderWidget()
        } else {
          existing.addEventListener('load', renderWidget)
        }
      } else {
        window.fbAsyncInit = function () {
          window.FB.init({ xfbml: true, version: FB_SDK_VERSION })
          renderWidget()
        }
        const script = document.createElement('script')
        script.id = 'facebook-jssdk'
        script.src = `https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=${FB_SDK_VERSION}`
        script.async = true
        script.defer = true
        script.crossOrigin = 'anonymous'
        script.onerror = () => { if (!cancelled) setLoadFailed(true) }
        document.body.appendChild(script)
      }
    }

    return () => { cancelled = true; clearTimeout(failTimer) }
  }, [])

  if (loadFailed) {
    return (
      <div className="fbw-fallback">
        <div className="fbw-fallback-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8v-6.93H7.9V12H10V9.5C10 7.46 11.66 5.8 13.7 5.8H16v2.87h-1.5c-.63 0-1.14.51-1.14 1.14V12H16l-.5 2.87h-2.14V21.8c4.56-.93 8-4.96 8-9.8z"/>
          </svg>
        </div>
        <p className="fbw-fallback-text">
          Facebook content couldn't load here (often blocked by ad/privacy blockers).
        </p>
        <a href={pageUrl} target="_blank" rel="noreferrer" className="fbw-fallback-btn">
          Visit our Facebook Page →
        </a>
        <style>{`
          .fbw-fallback { text-align:center; padding:32px 20px; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:14px; }
          .fbw-fallback-icon { display:flex; justify-content:center; margin-bottom:10px; }
          .fbw-fallback-text { font-size:13px; color:#64748b; margin:0 0 14px; }
          .fbw-fallback-btn { display:inline-block; background:#1877F2; color:#fff; text-decoration:none; font-size:13px; font-weight:600; padding:10px 18px; border-radius:8px; }
          .fbw-fallback-btn:hover { background:#166fe0; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="fbw-wrap" ref={containerRef}>
      {!loaded && (
        <div className="fbw-skeleton" style={{ height }}>
          <span>Loading Facebook page...</span>
        </div>
      )}
      <div
        className="fb-page"
        data-href={pageUrl}
        data-tabs={tabs}
        data-width="500"
        data-height={height}
        data-small-header={smallHeader}
        data-adapt-container-width="true"
        data-hide-cover={hideCover}
        data-show-facepile={showFacepile}
        style={{ display: loaded ? 'block' : 'none' }}
      >
        <blockquote cite={pageUrl} className="fb-xfbml-parse-ignore">
          <a href={pageUrl}>MR.PAT Car Rental Service</a>
        </blockquote>
      </div>

      <style>{`
        .fbw-wrap { width: 100%; max-width: 500px; margin: 0 auto; }
        .fbw-skeleton { display:flex; align-items:center; justify-content:center; background:#f1f5f9; border-radius:14px; color:#94a3b8; font-size:13px; }
      `}</style>
    </div>
  )
}