'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Menu,X} from 'lucide-react';
import {useEffect,useState} from 'react';
import {navigation} from '@/data/profile';

export function Header(){
  const pathname=usePathname();
  const [open,setOpen]=useState(false);
  const [activeSection,setActiveSection]=useState<string|null>(null);
  const [scrolled,setScrolled]=useState(false);

  useEffect(()=>{
    if(pathname!=='/'){
      return;
    }

    const sections=navigation.filter(item=>item.homeSectionId).map(item=>document.getElementById(item.homeSectionId!)).filter((section):section is HTMLElement=>section!==null).sort((a,b)=>a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1);
    if(!sections.length)return;

    const updateActive=()=>{
      const marker=96;
      const crossed=sections.filter(section=>{
        const bounds=section.getBoundingClientRect();
        return bounds.top<=marker&&bounds.bottom>marker;
      }).sort((a,b)=>b.getBoundingClientRect().top-a.getBoundingClientRect().top)[0];
      if(crossed){setActiveSection(current=>current===crossed.id?current:crossed.id);return;}

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
        const isActive=homeTarget?activeSection===homeTarget:pathname===item.href||pathname.startsWith(`${item.href}/`);
        return <Link className={isActive?'is-active':undefined} key={item.id} href={href} aria-current={isActive?(homeTarget?'location':'page'):undefined} onClick={closeMenu}>{item.label}</Link>;
      })}
    </nav>
  </header>;
}
