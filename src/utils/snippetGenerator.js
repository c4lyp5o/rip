export const generateSnippet = (language, workspace) => {
	if (!workspace || !workspace.url) throw new Error("Invalid URL");

	const urlObj = workspace.url;

	if (workspace.queries) {
		workspace.queries.forEach((q) => {
			if (q.key && q.active) urlObj.searchParams.append(q.key, q.value);
		});
	}
	const fullUrl = urlObj.toString();
	const method = workspace.method;

	const activeHeaders = (workspace.headers || []).filter(
		(h) => h.active && h.key,
	);

	const activeAuth = workspace.auth || { type: "none" };
	if (activeAuth.type === "bearer" && activeAuth.token) {
		activeHeaders.push({
			key: "Authorization",
			value: `Bearer ${activeAuth.token}`,
		});
	} else if (
		activeAuth.type === "basic" &&
		(activeAuth.username || activeAuth.password)
	) {
		const encoded = btoa(`${activeAuth.username}:${activeAuth.password}`);
		activeHeaders.push({ key: "Authorization", value: `Basic ${encoded}` });
	}

	const hasBody =
		["POST", "PUT", "PATCH", "DELETE"].includes(method) && workspace.body;
	const bodyString = workspace.body || "";

	// --- GENERATORS ---

	if (language === "curl") {
		let curl = `curl -X ${method} "${fullUrl}"`;
		activeHeaders.forEach((h) => {
			curl += ` \\\n  -H "${h.key}: ${h.value}"`;
		});
		if (hasBody) {
			const escapedBody = bodyString.replace(/'/g, "'\\''");
			curl += ` \\\n  -d '${escapedBody}'`;
		}
		return curl;
	}

	if (language === "fetch") {
		let fetchCode = `const url = "${fullUrl}";\n`;
		fetchCode += `const options = {\n  method: "${method}",\n`;
		if (activeHeaders.length > 0) {
			fetchCode += `  headers: {\n`;
			activeHeaders.forEach((h) => {
				fetchCode += `    "${h.key}": "${h.value}",\n`;
			});
			fetchCode += `  },\n`;
		}
		if (hasBody) {
			fetchCode += `  body: JSON.stringify(${bodyString.trim() || "{}"})\n`;
		}
		fetchCode += `};\n\n`;
		fetchCode += `try {\n  const response = await fetch(url, options);\n  const data = await response.json();\n  console.log(data);\n} catch (error) {\n  console.error(error);\n}`;
		return fetchCode;
	}

	if (language === "python") {
		let pyCode = `import requests\n\nurl = "${fullUrl}"\n`;
		if (hasBody) pyCode += `payload = """${bodyString}"""\n`;
		if (activeHeaders.length > 0) {
			pyCode += `headers = {\n`;
			activeHeaders.forEach((h) => {
				pyCode += `    "${h.key}": "${h.value}",\n`;
			});
			pyCode += `}\n\n`;
		}
		pyCode += `response = requests.request("${method}", url`;
		if (activeHeaders.length > 0) pyCode += `, headers=headers`;
		if (hasBody) pyCode += `, data=payload`;
		pyCode += `)\n\nprint(response.text)`;
		return pyCode;
	}

	if (language === "csharp") {
		let csCode = `using System.Net.Http;\nusing System.Net.Http.Headers;\n\nvar client = new HttpClient();\n`;
		csCode += `var request = new HttpRequestMessage(HttpMethod.${method.charAt(0) + method.slice(1).toLowerCase()}, "${fullUrl}");\n\n`;
		activeHeaders.forEach((h) => {
			csCode += `request.Headers.Add("${h.key}", "${h.value}");\n`;
		});
		if (hasBody) {
			const escapedBody = bodyString.replace(/"/g, '""');
			csCode += `\nvar content = new StringContent(@"${escapedBody}");\n`;
			const contentType =
				activeHeaders.find((h) => h.key.toLowerCase() === "content-type")
					?.value || "application/json";
			csCode += `content.Headers.ContentType = new MediaTypeHeaderValue("${contentType}");\n`;
			csCode += `request.Content = content;\n`;
		}
		csCode += `\nvar response = await client.SendAsync(request);\nresponse.EnsureSuccessStatusCode();\n`;
		csCode += `Console.WriteLine(await response.Content.ReadAsStringAsync());`;
		return csCode;
	}

	if (language === "powershell") {
		let psCode = `$uri = "${fullUrl}"\n\n`;

		if (activeHeaders.length > 0) {
			psCode += `$headers = @{\n`;
			activeHeaders.forEach((h) => {
				const escapedValue = h.value.replace(/"/g, '`"');
				psCode += `    "${h.key}" = "${escapedValue}"\n`;
			});
			psCode += `}\n\n`;
		}

		if (hasBody) {
			psCode += `$body = @"\n${bodyString}\n"@\n\n`;
		}

		psCode += `$response = Invoke-RestMethod -Uri $uri -Method ${method}`;
		if (activeHeaders.length > 0) psCode += ` -Headers $headers`;
		if (hasBody) psCode += ` -Body $body`;

		psCode += `\n$response | ConvertTo-Json -Depth 10`;
		return psCode;
	}

	throw new Error("Unsupported language");
};
