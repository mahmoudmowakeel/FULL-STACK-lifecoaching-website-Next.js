// src/app/[locale]/components/LanguageToggle.tsx
'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function LanguageToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = params.locale as string;

  const switchLanguage = (newLocale: string) => {
    if (newLocale === currentLocale) return; // Don't switch if already active
    
    // Replace the locale in the current pathname
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  // Determine which language is active for styling
  const isArabicActive = currentLocale === 'ar';
  const isEnglishActive = currentLocale === 'en';

  return (
    <span className="flex bg-[#C3C3C3] rounded-2xl w-[5.2rem] h-[1.6rem] justify-between items-center text-[0.8rem] font-medium text-center">
      {/* Arabic Button */}
      <div 
        className={`w-full h-full flex items-center justify-center rounded-2xl cursor-pointer ${
          isArabicActive 
            ? 'bg-[#214E78] text-white'  // Active styles
            : 'hover:text-white'     // Hover styles
        }`}
        onClick={() => switchLanguage('ar')}
      >
        <p className="px-3">AR</p>
      </div>
      
      {/* English Button */}
      <div 
        className={`w-full h-full flex items-center justify-center rounded-2xl cursor-pointer ${
          isEnglishActive 
            ? 'bg-[#214E78] text-white'  // Active styles
            : 'hover:text-white'     // Hover styles
        }`}
        onClick={() => switchLanguage('en')}
      >
        <p className="px-3">EN</p>
      </div>
    </span>
  );
}