'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Menu,X} from 'lucide-react';
import {useEffect,useState} from 'react';
import {navigation} from '@/data/profile';
import {navigationHoverEvent,type NavigationHoverDetail} from '@/lib/navigation-events';

export function Header(){
  const pathname=usePathname();
  const [open,setOpen]=useState(false);
  const [activeSection,setActiveSection]=useState<string|null>(null);
  const [hoveredNodeId,setHoveredNodeId]=useState<string|null>(null);
  const [scrolled,setScrolled]=useState(false);

  useEffect(()=>{
    const handleSceneHover=(event:Event)=>setHoveredNodeId((event as CustomEvent<NavigationHoverDetail>).detail);
    window.addEventListener(navigationHoverEvent,handleSceneHover);
    return()=>window.removeEventListener(navigationHoverEvent,handleSceneHover);
  },[]);

  useEffect(()=>{
    if(pathname!=='/'){
      return;
    }

    const sections=navigation.filter(item=>item.homeSectionId).map(item=>document.getElementById(item.homeSectionId!)).filter((section):section is HTMLElement=>section!==null).sort((a,b)=>a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1);
    if(!sections.length)return;

    const updateActive=()=>{
      const marker=96;
      const atBottom=window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-2;
      if(atBottom){
        const lastVisible=sections.filter(section=>{
          const bounds=section.getBoundingClientRect();
          return bounds.bottom>marker&&bounds.top<window.innerHeight;
        }).at(-1);
        if(lastVisible){setActiveSection(current=>current===lastVisible.id?current:lastVisible.id);return;}
      }

      const crossed=sections.filter(section=>{
        const bounds=section.getBoundingClientRect();
        return bounds.top<=marker&&bounds.bottom>marker;
      }).sort((a,b)=>b.getBoundingClientRect().top-a.getBoundingClientRect().top)[0];
      if(crossed){setActiveSection(current=>current===crossed.id?current:crossed.id);return;}

      const visible=sections.map(section=>({section,bounds:section.getBoundingClientRect()})).map(item=>({...item,visibleHeight:Math.max(0,Math.min(item.bounds.bottom,window.innerHeight)-Math.max(item.bounds.top,marker))})).sort((a,b)=>b.visibleHeight-a.visibleHeight)[0];
      if(visible?.visibleHeight){setActiveSection(current=>current===visible.section.id?current:visible.section.id);return;}

      const passed=sections.filter(section=>section.getBoundingClientRect().bottom<=marker).at(-1);
      const next=passed?.id??null;
      setActiveSection(current=>current===next?current:next);
    };
    const observer=new IntersectionObserver(updateActive,{rootMargin:'-96px 0px -55% 0px',threshold:[0,.01,.1]});
    sections.forEach(section=>observer.observe(section));
    window.addEventListener('scroll',updateActive,{passive:true});
    const initialUpdate=requestAnimationFrame(updateActive);
    return()=>{cancelAnimationFrame(initialUpdate);observer.disconnect();window.removeEventListener('scroll',updateActive);};
  },[pathname]);

  useEffect(()=>{
    const updateScrolled=()=>setScrolled(window.scrollY>32);
    const initialUpdate=requestAnimationFrame(updateScrolled);
    window.addEventListener('scroll',updateScrolled,{passive:true});
    return()=>{cancelAnimationFrame(initialUpdate);window.removeEventListener('scroll',updateScrolled);};
  },[]);

  const closeMenu=()=>setOpen(false);
  return <header className={`site-header${scrolled?' is-scrolled':''}`}>
    <Link className="brand" href="/" aria-label="Lohith home" onClick={closeMenu}><span>L.</span><b>LOHITH <i>— BEYOND THE INTERFACE</i></b></Link>
    <button className="menu-toggle" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="main-navigation" onClick={()=>setOpen(!open)}>{open?<X aria-hidden="true"/>:<Menu aria-hidden="true"/>}</button>
    <nav id="main-navigation" aria-label="Main navigation" className={open?'main-nav is-open':'main-nav'}>
      {navigation.map(item=>{
        const homeTarget=pathname==='/'?item.homeSectionId:undefined;
        const href=homeTarget?`#${homeTarget}`:item.href;
        const isRouteActive=pathname===item.href||pathname.startsWith(`${item.href}/`);
        const isSectionActive=Boolean(item.homeSectionId&&activeSection===item.homeSectionId);
        const isActive=isSectionActive||hoveredNodeId===item.id||isRouteActive;
        return <Link className={isActive?'is-active':undefined} key={item.id} href={href} aria-current={isRouteActive?'page':isSectionActive?'location':undefined} onClick={event=>{
          closeMenu();
          if(!homeTarget)return;
          event.preventDefault();
          const target=document.getElementById(homeTarget);
          if(!target)return;
          if(window.location.hash!==href)window.history.pushState({},'',href);
          target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
        }}>{item.label}</Link>;
      })}
    </nav>
  </header>;
}
