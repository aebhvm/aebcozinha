export type MenuDay = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo'

export type MenuItem = {
  section: string
  item: string
  values: Record<MenuDay, string>
}

export type BreakfastMenu = {
  id: string
  title: string
  items: MenuItem[]
}

export const menuDays: Array<{ key: MenuDay; label: string }> = [
  { key: 'segunda', label: 'Segunda' },
  { key: 'terca', label: 'Terça' },
  { key: 'quarta', label: 'Quarta' },
  { key: 'quinta', label: 'Quinta' },
  { key: 'sexta', label: 'Sexta' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
]

const sameEveryDay = (value: string): Record<MenuDay, string> => ({
  segunda: value,
  terca: value,
  quarta: value,
  quinta: value,
  sexta: value,
  sabado: value,
  domingo: value,
})

const byDay = (
  segunda: string,
  terca: string,
  quarta: string,
  quinta: string,
  sexta: string,
  sabado: string,
  domingo: string,
): Record<MenuDay, string> => ({ segunda, terca, quarta, quinta, sexta, sabado, domingo })

export const breakfastMenus: BreakfastMenu[] = [
  {
    id: 'villa-mayor',
    title: 'Villa Mayor',
    items: [
      { section: 'Frutas', item: 'Fruta 1', values: sameEveryDay('Mamão') },
      { section: 'Frutas', item: 'Fruta 2', values: byDay('Abacaxi', 'Melancia', 'Abacaxi', 'Melancia', 'Melancia', 'Abacaxi', 'Melancia') },
      { section: 'Frutas', item: 'Fruta 3', values: byDay('Melão esp.', 'Melão jap.', 'Melão esp.', 'Melão jap.', 'Melão esp.', 'Melão jap.', 'Abacaxi') },
      { section: 'Bolos', item: 'Bolo 1', values: byDay('Mole', 'Macaxeira', 'Milho', 'Maracujá', 'Formigueiro', 'Laranja', 'Goiaba') },
      { section: 'Bolos', item: 'Bolo 2', values: byDay('Chocolate', 'Cenoura', 'Limão', 'Mesclado', 'Coco', 'Batata doce', 'Banana') },
      { section: 'Cubas quentes', item: 'Cuba 1', values: sameEveryDay('Salsicha') },
      { section: 'Cubas quentes', item: 'Cuba 2', values: sameEveryDay('Ovos') },
      { section: 'Cubas quentes', item: 'Cuba 3', values: sameEveryDay('Cuscuz') },
      { section: 'Cubas quentes', item: 'Cuba 4', values: sameEveryDay('Pão de queijo') },
      { section: 'Cubas quentes', item: 'Cuba 5', values: byDay('Bacon', 'Carne de sol', 'Frango', 'Bacon', 'Carne de sol', 'Calabresa', 'Bacon') },
      { section: 'Cubas quentes', item: 'Cuba 6', values: byDay('Batata doce', 'Macaxeira', 'Calabresa', 'Macaxeira', 'Calabresa', 'Batata doce', 'Frango') },
      { section: 'Barro', item: 'Opção 1', values: byDay('Mini folhado', 'Rosca mineira', 'Cost. Adão', 'Enroladinho', 'Salgado de queijo', 'Mini sanduíche', 'Torta de frango') },
      { section: 'Barro', item: 'Opção 2', values: byDay('Empadas', 'Croissin', 'Pão recheado', 'Salgado misto', 'Mini árabe', 'Torta', 'Tortinha mista') },
      { section: 'Barro', item: 'Opção 3', values: byDay('Rabanada', 'Fatia húngara', 'Rosq. açúcar', 'Goiabinha', 'Tartelet', 'Tortinha de limão', 'Palmier') },
      { section: 'Estante', item: 'Doce', values: byDay('Queijadinha', 'Brownie', 'Cupcake', 'Brigadeiro', 'Mini donuts', 'Palha italiana', 'Cupcake') },
      { section: 'Pães', item: 'Carioquinha', values: sameEveryDay('Carioquinha') },
      { section: 'Pães', item: 'Pão de forma', values: sameEveryDay('Pão de forma') },
      { section: 'Pães', item: 'Pão integral', values: sameEveryDay('Pão integral') },
      { section: 'Suqueira', item: 'Laranja', values: sameEveryDay('Laranja') },
      { section: 'Suqueira', item: 'Suco do dia', values: byDay('Cajá', 'Graviola', 'Caju', 'Acerola', 'Maracujá', 'Goiaba', 'Manga') },
      { section: 'Suqueira', item: 'Coco', values: sameEveryDay('Coco') },
      { section: 'Suqueira', item: 'Detox', values: sameEveryDay('Detox') },
      { section: 'Pista fria', item: 'Pudim', values: byDay('Pudim de tapioca', 'Pudim de leite', 'Pudim de banana', 'Pudim de chocolate', 'Mosaico', 'Pudim de tapioca', 'Pudim de leite') },
      { section: 'Pista fria', item: 'Salada', values: sameEveryDay('Salada') },
      { section: 'Pista fria', item: 'Requeijão', values: sameEveryDay('Requeijão') },
      { section: 'Pista fria', item: 'Doce de goiaba', values: sameEveryDay('Doce de goiaba') },
      { section: 'Pista fria', item: 'Doce de leite', values: sameEveryDay('Doce de leite') },
      { section: 'Pista fria', item: 'Gelatina', values: sameEveryDay('Gelatina') },
      { section: 'Pista fria', item: 'Salada de frutas', values: sameEveryDay('Salada de frutas') },
      { section: 'Frutas extras', item: 'Maçã', values: sameEveryDay('Maçã') },
      { section: 'Frutas extras', item: 'Manga', values: sameEveryDay('Manga') },
      { section: 'Frutas extras', item: 'Goiaba', values: sameEveryDay('Goiaba') },
      { section: 'Frutas extras', item: 'Caju', values: sameEveryDay('Caju') },
      { section: 'Frutas extras', item: 'Uva', values: sameEveryDay('Uva') },
    ],
  },
  {
    id: 'villa-smart',
    title: 'Villa Smart',
    items: [
      { section: 'Frutas', item: 'Fruta 1', values: sameEveryDay('Mamão') },
      { section: 'Frutas', item: 'Fruta 2', values: byDay('Abacaxi', 'Melancia', 'Melão espanhol', 'Melão japonês', 'Melancia', 'Abacaxi', 'Melancia') },
      { section: 'Frutas', item: 'Fruta 3', values: sameEveryDay('Goiaba') },
      { section: 'Frutas', item: 'Fruta 4', values: sameEveryDay('Maçã') },
      { section: 'Frutas', item: 'Fruta 5', values: sameEveryDay('Banana') },
      { section: 'Bolos', item: 'Bolo 1', values: byDay('Laranja', 'Mole', 'Macaxeira', 'Milho', 'Coco', 'Formigueiro', 'Limão') },
      { section: 'Bolos', item: 'Bolo 2', values: byDay('Banana', 'Chocolate', 'Cenoura', 'Maracujá', 'Mesclado', 'Bolo goiaba', 'Batata doce') },
      { section: 'Cubas quentes', item: 'Cuba 1', values: sameEveryDay('Ovo mexido') },
      { section: 'Cubas quentes', item: 'Cuba 2', values: sameEveryDay('Salsicha') },
      { section: 'Cubas quentes', item: 'Cuba 3', values: sameEveryDay('Cuscuz') },
      { section: 'Cubas quentes', item: 'Cuba 4', values: byDay('Frango', 'Batata doce', 'Macaxeira', 'Calabresa', 'Frango', 'Batata doce', 'Calabresa') },
      { section: 'Pães', item: 'Carioquinha', values: sameEveryDay('Carioquinha') },
      { section: 'Pães', item: 'Massa fina', values: sameEveryDay('Massa fina') },
      { section: 'Pães', item: 'Pão de forma', values: sameEveryDay('Pão de forma') },
      { section: 'Pães', item: 'Pão integral', values: sameEveryDay('Pão integral') },
      { section: 'Sucos', item: 'Suco 1', values: sameEveryDay('Laranja') },
      { section: 'Sucos', item: 'Suco 2', values: byDay('Manga', 'Cajá', 'Graviola', 'Caju', 'Acerola', 'Maracujá', 'Goiaba') },
      { section: 'Pista fria', item: 'Requeijão', values: sameEveryDay('Requeijão') },
      { section: 'Pista fria', item: 'Doce de goiaba', values: sameEveryDay('Doce de goiaba') },
      { section: 'Pista fria', item: 'Doce de leite', values: sameEveryDay('Doce de leite') },
      { section: 'Pista fria', item: 'Gelatina', values: sameEveryDay('Gelatina') },
      { section: 'Bancada', item: 'Leite', values: sameEveryDay('Leite') },
      { section: 'Bancada', item: 'Iogurte', values: sameEveryDay('Iogurte') },
      { section: 'Bancada', item: 'Biscoitos', values: sameEveryDay('Biscoitos') },
      { section: 'Bancada', item: 'Café', values: sameEveryDay('Café') },
      { section: 'Bancada', item: 'Capuccino', values: sameEveryDay('Capuccino') },
      { section: 'Bancada', item: 'Chocolate', values: sameEveryDay('Chocolate') },
      { section: 'Bancada', item: 'Achocolatado', values: sameEveryDay('Achocolatado') },
      { section: 'Bancada', item: 'Chás', values: sameEveryDay('Chás') },
      { section: 'Bancada', item: 'Aveia', values: sameEveryDay('Aveia') },
      { section: 'Bancada', item: 'Cereal c/açúcar', values: sameEveryDay('Cereal c/açúcar') },
      { section: 'Bancada', item: 'Granola', values: sameEveryDay('Granola') },
      { section: 'Produzido', item: 'Tapioca', values: sameEveryDay('Tapioca') },
    ],
  },
]

const jsWeekdayToMenuDay: Record<number, MenuDay> = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado',
}

export function currentMenuDay(): MenuDay {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Fortaleza',
    weekday: 'short',
  })
  const short = formatter.format(new Date()).toLowerCase()
  const index = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(short.slice(0, 3))
  return jsWeekdayToMenuDay[index === -1 ? new Date().getDay() : index]
}
