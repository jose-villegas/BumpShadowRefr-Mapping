varying vec3 varNormal, varEyeDir;
#define MAX_LIGHTS 8
#define NUM_LIGHTS 4
varying vec3 lightDirection[MAX_LIGHTS];
varying float att[MAX_LIGHTS];
uniform float roughness = 0.3;

void main()
{
	vec3 finalValue = gl_FrontLightModelProduct.sceneColor * gl_FrontMaterial.ambient;
	// set important material values
	float roughnessValue = roughness; // 0 : smooth, 1: rough
	float F0 = 0.8; // fresnel reflectance at normal incidence
	float k = 0.2; // fraction of diffuse reflection (specular reflection = 1 - k)
	// interpolating normals will change the length of the normal, so renormalize the normal.
	vec3 normal = normalize(varNormal);
	int i;
	for(i=0; i<NUM_LIGHTS; ++i)
	{
		vec3 D = normalize(gl_LightSource[i].spotDirection);
		vec3 L = normalize(lightDirection[i]);

		if (0.0 == gl_LightSource[i].position.w)
		{
			att[i] = 1.0;
			L = normalize(vec3(gl_LightSource[i].position));
		} 
			
		if(dot(-L, D) > gl_LightSource[i].spotCosCutoff)
		{	
			// do the lighting calculation for each fragment.
			float NdotL = max(dot(normal, L), 0.0);
	
			float specular = 0.0;
			if(NdotL > 0.0)
			{
				vec3 eyeDir = normalize(varEyeDir);

				// calculate intermediary values
				vec3 halfVector = normalize(L + eyeDir);
				float NdotH = max(dot(normal, halfVector), 0.0); 
				float NdotV = max(dot(normal, eyeDir), 0.0); // note: this could also be NdotL, which is the same value
				float VdotH = max(dot(eyeDir, halfVector), 0.0);
				float mSquared = roughnessValue * roughnessValue;
		
				// geometric attenuation
				float NH2 = 2.0 * NdotH;
				float g1 = (NH2 * NdotV) / VdotH;
				float g2 = (NH2 * NdotL) / VdotH;
				float geoAtt = min(1.0, min(g1, g2));

				if(gl_LightSource[i].spotCutoff <= 90.0 && 0.0 != gl_LightSource[i].position.w) 
				{
					att[i] *= pow(gl_LightSource[i].spotCosCutoff, gl_LightSource[i].spotExponent);	
				}
				
				// roughness (or: microfacet distribution function)
				// beckmann distribution function
				float r1 = 1.0 / ( 3.14 * mSquared * pow(NdotH, 4.0));
				float r2 = (NdotH * NdotH - 1.0) / (mSquared * NdotH * NdotH);
				float roughness = r1 * exp(r2);
		
				// fresnel
				// Schlick approximation
				float fresnel = pow(1.0 - VdotH, 5.0);
				fresnel *= (1.0 - F0);
				fresnel += F0;
		
				specular = (fresnel * geoAtt * roughness) / (NdotV * NdotL * 3.14);
			}

			finalValue += gl_LightSource[i].ambient * gl_FrontMaterial.ambient * att[i];
			finalValue +=  gl_LightSource[i].specular * gl_FrontMaterial.specular * att[i];
			finalValue += gl_LightSource[i].diffuse * gl_FrontMaterial.diffuse * NdotL * (k + specular * (1.0 - k)) * att[i];
		}
	}
	gl_FragColor = vec4(finalValue, 1.0);
}