(function (root) {
  function minutes(m) {
    if (m == null) return null;
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const rest = m % 60;
    return rest ? `${h} h ${rest} min` : `${h} h`;
  }

  function nutritionParts(n) {
    if (!n) return [];
    const parts = [];
    if (n.calories != null) parts.push(`${n.calories} kcal`);
    if (n.fat != null) parts.push(`${n.fat} g fat`);
    if (n.carbs != null) parts.push(`${n.carbs} g carbs`);
    if (n.protein != null) parts.push(`${n.protein} g protein`);
    return parts;
  }

  function toMarkdown(recipe, opts) {
    const { system, factor } = opts;
    const lines = [`# ${recipe.name}`, ''];
    const meta = [];
    const servings = root.RC.scaleYield(recipe.servings, factor);
    if (servings) meta.push(`**Yield:** ${servings}`);
    if (recipe.prep != null) meta.push(`**Prep:** ${minutes(recipe.prep)}`);
    if (recipe.cook != null) meta.push(`**Cook:** ${minutes(recipe.cook)}`);
    if (recipe.total != null) meta.push(`**Total:** ${minutes(recipe.total)}`);
    if (factor !== 1) meta.push(`**Scaled:** ${root.RC.formatQty(factor)}×`);
    if (meta.length) lines.push(meta.join(' · '), '');
    const nutrition = nutritionParts(recipe.nutrition);
    if (nutrition.length) {
      const size = recipe.nutrition.servingSize ? ` (${recipe.nutrition.servingSize})` : '';
      lines.push(`**Per serving${size}:** ${nutrition.join(' · ')}`, '');
    }
    lines.push('## Ingredients', '');
    const groups = recipe.groups && recipe.groups.length
      ? recipe.groups
      : [{ name: null, start: 0, count: recipe.ingredients.length }];
    groups.forEach((g, gi) => {
      if (g.name) {
        if (gi > 0) lines.push('');
        lines.push(`**${g.name}**`, '');
      }
      for (const ing of recipe.ingredients.slice(g.start, g.start + g.count)) {
        const parsed = root.RC.parseIngredient(ing);
        lines.push(`- [ ] ${root.RC.renderIngredient(parsed, opts)}`);
      }
    });
    if (recipe.steps.length) {
      lines.push('', '## Instructions', '');
      recipe.steps.forEach((step, i) => {
        lines.push(`${i + 1}. ${root.RC.convertTemps(step, system)}`);
      });
    }
    if (recipe.source) lines.push('', `[Source](${recipe.source.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\s/g, '%20')})`);
    lines.push('');
    return lines.join('\n');
  }

  root.RC = root.RC || {};
  root.RC.toMarkdown = toMarkdown;
  root.RC.formatMinutes = minutes;
  root.RC.nutritionParts = nutritionParts;
})(globalThis);
