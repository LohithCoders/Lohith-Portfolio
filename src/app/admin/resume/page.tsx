import type {Metadata} from 'next';
import {ResumeManager} from '@/components/content/resume-manager';

export const metadata:Metadata={title:'Resume Manager',robots:{index:false,follow:false}};

export default function AdminResumePage(){return <ResumeManager/>;}
