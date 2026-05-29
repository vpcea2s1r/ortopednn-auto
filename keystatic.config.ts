import { collection, config, fields } from '@keystatic/core';

export default config({
  storage: {
    kind: 'github',
    repo: process.env.KEYSTATIC_REPO || 'username/ortopednn-auto',
    path: ''
  },
  collections: {
    districts: collection({
      label: '📍 Районы',
      slugField: 'slug',
      path: 'src/content/districts/*',
      format: { contentField: 'body' },
      schema: {
        title: fields.text({ label: 'Заголовок', validation: { isRequired: true } }),
        description: fields.text({ label: 'SEO Description', multiline: true }),
        slug: fields.slug({ name: { label: 'URL' } }),
        metro: fields.array(fields.text({ label: 'Станция' }), { itemLabel: i => i || 'Метро' }),
        transport: fields.text({ label: 'Транспорт', multiline: true }),
        local_faq: fields.array(
          fields.object({
            q: fields.text({ label: 'Вопрос' }),
            a: fields.text({ label: 'Ответ', multiline: true })
          }),
          { itemLabel: i => i?.q || 'Вопрос' }
        ),
        body: fields.markdoc({ label: 'Контент' })
      }
    }),
    services: collection({
      label: '🦷 Услуги',
      slugField: 'slug',
      path: 'src/content/services/*',
      format: { contentField: 'body' },
      schema: {
        title: fields.text({ label: 'Название', validation: { isRequired: true } }),
        price: fields.number({ label: 'Цена (₽)', validation: { min: 0 } }),
        slug: fields.slug({ name: { label: 'URL' } }),
        body: fields.markdoc({ label: 'Описание' })
      }
    })
  }
});