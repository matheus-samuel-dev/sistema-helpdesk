import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resolvePageMetadata } from '../config/app';

function setMeta(selector: string, content: string) {
  const element = document.querySelector<HTMLMetaElement>(selector);
  if (element) {
    element.content = content;
  }
}

export default function DocumentMetadata() {
  const location = useLocation();

  useEffect(() => {
    const metadata = resolvePageMetadata(location.pathname);
    document.title = metadata.title;
    setMeta('meta[name="description"]', metadata.description);
    setMeta('meta[property="og:title"]', metadata.title);
    setMeta('meta[property="og:description"]', metadata.description);
  }, [location.pathname]);

  return null;
}
