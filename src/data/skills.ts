import type { Skill } from './types';
const c={ai:'AI & ML',gen:'Generative AI & LLMs',agents:'Agentic AI & Multi-Agent Systems',programming:'Programming',front:'Frontend',back:'Backend',automation:'Automation',qa:'Testing & QA',platforms:'Cloud & AI Platforms',tools:'Dev Tools'};
export const skills:Skill[]=[
{id:'python',slug:'python',name:'Python',categories:[c.ai,c.programming],description:'A programming language included in Lohith’s AI and software exploration.',status:'Exploring'},
{id:'machine-learning',slug:'machine-learning',name:'Machine Learning',categories:[c.ai],description:'Methods for learning patterns from data and building predictive systems.',status:'Exploring'},
{id:'neural-networks',slug:'neural-networks',name:'Neural Networks',categories:[c.ai],description:'A family of models inspired by networks of connected computational units.',status:'Exploring'},
{id:'prompt-engineering',slug:'prompt-engineering',name:'Prompt Engineering',categories:[c.gen],description:'Designing instructions and context for generative AI systems.',status:'Exploring'},
{id:'openrouter',slug:'openrouter',name:'OpenRouter',categories:[c.gen],description:'A model access platform explored in generative AI work.',status:'Exploring'},
{id:'hugging-face',slug:'hugging-face',name:'Hugging Face',categories:[c.gen],description:'Tools and models for exploring machine learning and generative AI.',status:'Exploring'},
{id:'langchain',slug:'langchain',name:'LangChain',categories:[c.agents],description:'A framework explored for composing applications with language models.',status:'Exploring'},
{id:'langgraph',slug:'langgraph',name:'LangGraph',categories:[c.agents],description:'A framework explored for stateful, graph-based agent workflows.',status:'Exploring'},
{id:'langflow',slug:'langflow',name:'LangFlow',categories:[c.agents],description:'A visual environment explored for building language model workflows.',status:'Exploring'},
{id:'relevance-ai',slug:'relevance-ai',name:'Relevance AI',categories:[c.agents],description:'A platform explored for building AI agents and workflows.',status:'Exploring'},
{id:'javascript',slug:'javascript',name:'JavaScript',categories:[c.programming],description:'A programming language for interactive web experiences.',status:'Exploring'},
{id:'typescript',slug:'typescript',name:'TypeScript',categories:[c.programming],description:'A typed language used to build more reliable JavaScript applications.',status:'Exploring'},
{id:'react',slug:'react',name:'React',categories:[c.front],description:'A component-based library for building user interfaces.',status:'Exploring'},
{id:'nextjs',slug:'nextjs',name:'Next.js',categories:[c.front],description:'A React framework for full-stack web applications.',status:'Exploring'},
{id:'html-css',slug:'html-css',name:'HTML & CSS',categories:[c.front],description:'The core markup and styling technologies of the web.',status:'Exploring'},
{id:'tailwind-css',slug:'tailwind-css',name:'Tailwind CSS',categories:[c.front],description:'A utility-first CSS framework for interface styling.',status:'Exploring'},
{id:'fastapi',slug:'fastapi',name:'FastAPI',categories:[c.back],description:'A Python framework for building APIs.',status:'Exploring'},
{id:'firebase',slug:'firebase',name:'Firebase',categories:[c.back],description:'A platform for application backend and data services.',status:'Exploring'},
{id:'supabase',slug:'supabase',name:'Supabase',categories:[c.back],description:'An open-source platform for application backends and data.',status:'Exploring'},
{id:'n8n',slug:'n8n',name:'n8n',categories:[c.automation],description:'A workflow automation platform explored for connecting services.',status:'Exploring'},
{id:'taskade',slug:'taskade',name:'Taskade',categories:[c.automation],description:'A collaborative workspace and automation platform explored by Lohith.',status:'Exploring'},
{id:'bolt-new',slug:'bolt-new',name:'Bolt.new',categories:[c.automation],description:'A browser-based tool explored for building software with AI.',status:'Exploring'},
{id:'playwright',slug:'playwright',name:'Playwright',categories:[c.qa],description:'A browser automation framework for software testing.',status:'Exploring'},
{id:'google-vertex-ai',slug:'google-vertex-ai',name:'Google Vertex AI',categories:[c.platforms],description:'Google Cloud’s platform for building and using machine learning systems.',status:'Exploring'},
{id:'streamlit',slug:'streamlit',name:'Streamlit',categories:[c.platforms],description:'A Python framework for building data and AI applications.',status:'Exploring'},
{id:'github',slug:'github',name:'GitHub',categories:[c.tools],description:'A platform for hosting and collaborating on software projects.',status:'Exploring'},
{id:'vite',slug:'vite',name:'Vite',categories:[c.tools],description:'A frontend build tool used by public project repositories.',status:'Exploring'}
];
export const skillBySlug=(slug:string)=>skills.find(item=>item.slug===slug);
