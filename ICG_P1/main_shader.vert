#define MAX_LIGHTS 8
#define NUM_LIGHTS 2

varying vec3 normal;
varying vec3 eyeVec;

varying vec3 lightDir[MAX_LIGHTS];
varying vec3 lightSpotDir[MAX_LIGHTS];
varying vec3 halfVector[MAX_LIGHTS];
varying float att[MAX_LIGHTS];

uniform int bEnableBumpMapping = 0;
uniform int bEnableShadowMapping = 0;

varying vec4 ShadowCoord;
uniform mat4 DepthBiasMVP;

void main()
{
	int i;

	gl_Position = ftransform();
	gl_TexCoord[0] = gl_MultiTexCoord0;
	vec4 vVertex = gl_ModelViewMatrix * gl_Vertex;
	eyeVec = -vVertex.xyz;

	normal = normalize(gl_NormalMatrix * gl_Normal);

	mat3 tbnMatrix;
		
	if(bEnableBumpMapping == 1)
	{
		vec3 n = normal;
		vec3 t = normalize(gl_NormalMatrix * gl_MultiTexCoord1.xyz);
		vec3 b = cross(n, t) * gl_MultiTexCoord1.w;
		
		tbnMatrix = mat3(	t.x, b.x, n.x,
							t.y, b.y, n.y,
							t.z, b.z, n.z	);
	}

	if(bEnableShadowMapping == 1)
	{
		ShadowCoord = DepthBiasMVP * gl_Vertex;
	}

	for(i = 0; i < NUM_LIGHTS; i++)
	{
		lightDir[i] = gl_LightSource[i].position.xyz - vVertex;

		lightSpotDir[i] = gl_LightSource[i].spotDirection;
		
		halfVector[i] = gl_LightSource[i].halfVector.xyz - vVertex;		

		float d = length(lightDir[i]);
		att[i] = 1.0 / ( gl_LightSource[i].constantAttenuation + (gl_LightSource[i].linearAttenuation*d) + (gl_LightSource[i].quadraticAttenuation * d * d) );

		// Directional Light
		if(gl_LightSource[i].position.w == 0)
		{
			lightDir[i] = gl_LightSource[i].position.xyz;
			att[i] = 1.0;
		}

		if(bEnableBumpMapping == 1)
		{
			lightDir[i] = tbnMatrix * lightDir[i];
			halfVector[i] = tbnMatrix * halfVector[i];
			lightSpotDir[i] = tbnMatrix * lightSpotDir[i]; 
		}
	}
}