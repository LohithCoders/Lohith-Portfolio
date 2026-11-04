export type Status='Exploring'|'Practicing'|'Experienced';
export type Skill={id:string;slug:string;name:string;categories:string[];description:string;status:Status};
export type Project={id:string;slug:string;name:string;description:string;problem:string;solution:string;techIds:string[];status:string;timeline:string;images:string[];githubUrl:string;liveUrl:string;relatedSkillIds:string[];relatedArticleIds:string[];featured:boolean};
export type Experience={id:string;slug:string;organization:string;organizationUrl:string;roleProgram:string;timeline:string;description:string;responsibilities:string[];skillIds:string[];links:string[];publishedWork:{title:string;url:string;type:'Article'|'Tutorial';date:string}[];status:'completed'|'ongoing'|'internship'|'TODO'};
export type Achievement={id:string;slug:string;title:string;issuer:string;date:string;credentialUrl:string;description:string;image:string};
export type Leadership={id:string;slug:string;role:string;organization:string;responsibilities:string[];activities:string[];photos:string[]};
export type Article={id:string;slug:string;title:string;abstract:string;status:string;date:string;references:string[];readMoreUrl:string;techIds:string[]};

export type Entity={id:string;slug:string;label:string};
