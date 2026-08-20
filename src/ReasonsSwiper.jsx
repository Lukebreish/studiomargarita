import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Parallax, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/parallax';

/* Each frameBox is the blank-canvas window inside its background photo,
   measured precisely from the source image (percent of image width/height). */
export const REASON_SLIDES = [
  {
    id: 'emotional',
    title: 'Emotional connection',
    copy: 'A piece that resonates personally — memory, mood, identity.',
    background: '/scenes/emotional-connection.jpg',
    frameBox: { left: 31.17, top: 22.34, width: 37.55, height: 40.12 },
    onGlass: true,
  },
  {
    id: 'investment',
    title: 'Investment potential',
    copy: 'Art as an asset — value that can grow with the right piece.',
    background: '/scenes/auction-house.jpg',
    frameBox: { left: 27.79, top: 23.48, width: 41.18, height: 45.98 },
  },
  {
    id: 'status',
    title: 'Status and taste',
    copy: 'A statement of sophistication and cultural capital.',
    background: '/scenes/status-and-taste.jpg',
    frameBox: { left: 32.04, top: 22.26, width: 34.39, height: 36.63 },
  },
  {
    id: 'interior',
    title: 'Interior design',
    copy: 'The piece that pulls a whole room together.',
    background: '/scenes/interior-design.jpg',
    frameBox: { left: 28.13, top: 18.04, width: 42.19, height: 47.23 },
  },
];

export default function ReasonsSwiper({ artworks, onEnquire }) {
  const paintings = artworks && artworks.length ? artworks : [];

  return (
    <div className="reasons-swiper">
      <Swiper
        modules={[Navigation, Pagination, Parallax, Keyboard]}
        parallax
        keyboard={{ enabled: true }}
        navigation
        pagination={{
          clickable: true,
          renderBullet: (index, className) =>
            `<span class="${className}" aria-label="Go to slide ${index + 1} of ${REASON_SLIDES.length}"></span>`,
        }}
        speed={650}
        loop
        a11y={{ prevSlideMessage: 'Previous reason', nextSlideMessage: 'Next reason' }}
      >
        {REASON_SLIDES.map((slide, i) => {
          const painting = paintings[i % Math.max(paintings.length, 1)];
          return (
            <SwiperSlide key={slide.id}>
              <div
                className="reason-bg"
                style={{ backgroundImage: `url(${slide.background})` }}
                data-swiper-parallax="-15%"
              />
              {painting && (
                <div
                  className={'reason-painting-frame' + (slide.onGlass ? ' on-glass' : '')}
                  style={{
                    left: `${slide.frameBox.left}%`,
                    top: `${slide.frameBox.top}%`,
                    width: `${slide.frameBox.width}%`,
                    height: `${slide.frameBox.height}%`,
                  }}
                >
                  <img src={painting.image} alt={painting.title} />
                  {slide.onGlass && <div className="glass-sheen" />}
                </div>
              )}
              <div className="reason-caption" data-swiper-parallax="-30%">
                <div className="eyebrow">{slide.title}</div>
                <p>{slide.copy}</p>
                {painting && (
                  <button className="btn-outline btn-sm" onClick={() => onEnquire && onEnquire(painting)}>
                    Enquire about "{painting.title}"
                  </button>
                )}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
