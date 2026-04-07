const fs = require('fs');

let content = fs.readFileSync('src/lib/components/dashboard/GameTimeClock.svelte', 'utf-8');

content = content.replace(/let timeDisplay = \$derived\(\(\) => \{[\s\S]*?\}\);/, `let timeDisplay = $derived((() => {
		switch (timeOfDay) {
			case 'morning': return 'Утро';
			case 'afternoon': return 'День';
			case 'evening': return 'Вечер';
			case 'night': return 'Ночь';
			default: return 'Неизвестно';
		}
	})());`);

content = content.replace(/let weatherIcon = \$derived\(\(\) => \{[\s\S]*?\}\);/, `let weatherIcon = $derived((() => {
		switch (weather) {
			case 'Clear': return '☀️';
			case 'Cloudy': return '☁️';
			case 'Rain': return '🌧️';
			case 'Storm': return '⛈️';
			case 'Snow': return '❄️';
			case 'Fog': return '🌫️';
			default: return '☀️';
		}
	})());`);

content = content.replace(/let weatherEffect = \$derived\(\(\) => \{[\s\S]*?\}\);/, `let weatherEffect = $derived((() => {
		switch (weather) {
			case 'Rain': return 'Дождь замедляет передвижение.';
			case 'Storm': return 'Свирепая буря. Шанс засады снижен.';
			case 'Snow': return 'Холод замедляет регенерацию сил.';
			case 'Fog': return 'Трудно ориентироваться. Меткость снижена.';
			default: return 'Спокойная погода.';
		}
	})());`);

content = content.replace(/let formattedDate = \$derived\(\(\) => \{[\s\S]*?\}\);/, `let formattedDate = $derived((() => {
		const d = new Date(gameDate);
		const day = d.getDate();
		const monthIndex = d.getMonth();
		return \`\${day} \${months[monthIndex]}\`;
	})());`);

content = content.replace(/{timeDisplay\(\)}/g, '{timeDisplay}');
content = content.replace(/{weatherIcon\(\)}/g, '{weatherIcon}');
content = content.replace(/{weatherEffect\(\)}/g, '{weatherEffect}');
content = content.replace(/{formattedDate\(\)}/g, '{formattedDate}');

fs.writeFileSync('src/lib/components/dashboard/GameTimeClock.svelte', content, 'utf-8');
