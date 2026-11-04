import { describe, expect, it } from 'vitest'
import { answersOf, chatQuestions, questionId, questionsOf, stopOf, withoutStop } from './marks'

describe('marks in a shared turn', () => {
  it('reads the stop line a tool left, and takes it out of the text', () => {
    const t = 'The new test fails.\n\n(stopped by the tool: 5-hour limit reached · resets 2am)'
    expect(stopOf(t)).toBe('5-hour limit reached · resets 2am')
    expect(withoutStop(t)).toBe('The new test fails.')
    expect(stopOf('A plain reply.')).toBeUndefined()
  })

  it('finds [question] and [answer] lines the way thenwise does', () => {
    expect(questionsOf('Add retries.\n[question] Should the retry cap be 3 or 5?')).toEqual(['Should the retry cap be 3 or 5?'])
    expect(answersOf('[answer q-fa41] Five.\n[answer] the retry cap is five')).toEqual([{ id: 'q-fa41', text: 'Five.' }, { id: '', text: 'the retry cap is five' }])
  })

  it('gives a question the same id thenwise prints', async () => {
    // thenwise printed q-fa41 for this question in the README's handoff still.
    expect(await questionId('Should the retry cap be 3 or 5? The pricing team never said.')).toBe('q-fa41')
  })

  it('marks a question answered only by a later turn of the same chat', async () => {
    const q = 'Should the retry cap be 3 or 5? The pricing team never said.'
    const open = await chatQuestions([{ id: 't1', passages: [`Add retries.\n[question] ${q}`] }])
    expect(open.t1).toEqual([{ id: 'q-fa41', text: q, answered: false }])
    const closed = await chatQuestions([{ id: 't1', passages: [`[question] ${q}`] }, { id: 't2', passages: ['[answer q-fa41] Five, per the pricing team.'] }])
    expect(closed.t1![0]!.answered).toBe(true)
  })
})
