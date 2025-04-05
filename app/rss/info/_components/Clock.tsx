/**
 * シンプルなデジタル時計コンポーネント
 */
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const DigitalClock = () => {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return null;
  }

  const formatUnit = (date: Date, formatStr: string): string => {
    return format(date, formatStr, { locale: ja });
  };

  const time = formatUnit(now, 'HH:mm:ss');
  const date = formatUnit(now, 'yyyy年MM月dd日(E)');

  return (
    <>
      <div className="digital-clock">
        <div className="date">{date}</div>
        <div className="time">{time}</div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
        
        .digital-clock {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          color: #ffffff;
          text-align: center;
          margin: 1rem 0;
        }

        .date {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
          width: 100%;
        }

        .time {
          font-family: 'Orbitron', sans-serif;
          font-size: 3rem;
          font-weight: 700;
          letter-spacing: 2px;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
          color: #ffffff;
          width: 9ch;
          text-align: center;
        }

        @media (max-width: 640px) {
          .digital-clock {
            padding: 1rem;
          }

          .date {
            font-size: 1rem;
          }

          .time {
            font-size: 2.5rem;
            width: 9ch;
          }
        }
      `}</style>
    </>
  );
};

export default DigitalClock;
