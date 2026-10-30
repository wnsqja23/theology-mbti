import React,{lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './style.css';
const Editor=lazy(()=>import('./Editor'));
const root=document.getElementById('root');if(!root)throw new Error('Missing #root');
createRoot(root).render(<React.StrictMode>{location.pathname==='/editor'?<Suspense fallback={<p>검토 작업대를 불러옵니다.</p>}><Editor/></Suspense>:<App/>}</React.StrictMode>);
