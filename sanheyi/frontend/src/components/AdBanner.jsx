import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import AdPlaceholder from './AdPlaceholder';
import { AdService } from '../services/adService';
import '../styles/AdBanner.css';import { t } from '@/i18n';


const AdBanner = ({
  positions,
  ratio,
  placeholderLabel,
  interval = 5000,
  width = '100%',
  height = 'auto',
  className = '',
  style: customStyle
}) => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const timerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const preloadImages = (ads) => {
      return Promise.all(
        ads.map((ad) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = ad.adv_url;
            img.onload = resolve;
            img.onerror = reject;
          });
        })
      );
    };

    const fetchAds = async () => {
      try {
        setLoading(true);
        const results = await Promise.all(
          positions.map((pos) => AdService.fetchAd(pos))
        );
        const fetchedAds = results.flat();

        if (fetchedAds.length > 0) {
          // Preload all ad images before showing
          await preloadImages(fetchedAds);
        } else {
          console.warn('AdBanner: No ads fetched for positions:', positions);
        }

        if (isMounted) {
          console.log(`AdBanner: Loaded ${fetchedAds.length} ads for`, positions);
          setAds(fetchedAds);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch or preload ads:', error);
        if (isMounted) setLoading(false);
      }
    };

    fetchAds();

    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(positions)]);

  // Carousel logic
  const paginate = (newDirection) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = ads.length - 1;
      if (nextIndex >= ads.length) nextIndex = 0;
      return nextIndex;
    });
  };

  const startTimer = () => {
    stopTimer();
    if (ads.length > 1 && interval > 0) {
      timerRef.current = setInterval(() => {
        paginate(1);
      }, interval);
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    startTimer();
    return stopTimer;
  }, [ads.length, interval]);

  const handleAdClick = () => {
    const currentAd = ads[currentIndex];
    if (currentAd && currentAd.target_url) {
      window.open(currentAd.target_url, '_blank');
    }
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  if (loading) {
    return (
      <AdPlaceholder
        ratio={ratio}
        label={t("${placeholderLabel} 加载中...", { "placeholderLabel": placeholderLabel })}
        width={width}
        height={height}
        className={className}
        style={customStyle} />);


  }

  if (ads.length === 0) {
    return (
      <AdPlaceholder
        ratio={ratio}
        label={placeholderLabel}
        width={width}
        height={height}
        className={className}
        style={customStyle} />);


  }

  return (
    <div
      className={`ad-banner ${className}`}
      style={{
        aspectRatio: ratio ? `${ratio}` : undefined,
        width,
        height,
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 'var(--card-radius)',
        ...customStyle
      }}
      onMouseEnter={stopTimer}
      onMouseLeave={startTimer}>
      
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(_, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          onClick={handleAdClick}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0
          }}>
          
                    <img
            src={ads[currentIndex].adv_url}
            alt="Advertisement"
            className="ad-banner-slide"
            draggable={false} />
          
                </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons (Only if > 1 ad) */}
            {ads.length > 1 &&
      <>
                    <div
          className="ad-banner-nav-btn ad-banner-nav-prev"
          onClick={(e) => {
            e.stopPropagation();
            paginate(-1);
          }}>
          
                        <LeftOutlined />
                    </div>
                    <div
          className="ad-banner-nav-btn ad-banner-nav-next"
          onClick={(e) => {
            e.stopPropagation();
            paginate(1);
          }}>
          
                        <RightOutlined />
                    </div>
                </>
      }

            {/* Indicators */}
            {ads.length > 1 &&
      <div className="ad-banner-indicators">
                    {ads.map((_, idx) =>
        <div
          key={idx}
          className={`ad-banner-dot ${idx === currentIndex ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setDirection(idx > currentIndex ? 1 : -1);
            setCurrentIndex(idx);
          }} />

        )}
                </div>
      }
        </div>);

};

export default AdBanner;