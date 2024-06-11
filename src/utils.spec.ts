import { calculateRemainingMonthsToAnnualRenewal } from './utils';

describe('utils', () => {
  describe('calculateRemainingMonthsToAnnualRenewal()', () => {
    it.each`
      start                     | cancel                    | expectedRemainingMonths | expectedAnnualRenewalDate
      ${new Date('2021-01-01')} | ${new Date('2021-03-01')} | ${10}                   | ${new Date('2022-01-01')}
      ${new Date('2021-01-01')} | ${new Date('2022-01-10')} | ${11}                   | ${new Date('2023-01-01')}
      ${new Date('2021-01-01')} | ${new Date('2028-12-31')} | ${0}                    | ${new Date('2029-01-01')}
      ${new Date('2021-01-01')} | ${new Date('2022-01-01')} | ${0}                    | ${new Date('2022-01-01')}
      ${new Date('2024-06-03')} | ${new Date('2024-07-21')} | ${10}                   | ${new Date('2025-06-03')}
    `(
      'for start=$start and cancel=$cancel, it should return $expectedRemainingMonths and $expectedAnnualRenewalDate',
      ({
        start,
        cancel,
        expectedRemainingMonths,
        expectedAnnualRenewalDate,
      }) => {
        const { annualRenewalDate, remainingMonthsBeforeCancellation } =
          calculateRemainingMonthsToAnnualRenewal(start, cancel);

        expect(remainingMonthsBeforeCancellation).toEqual(
          expectedRemainingMonths
        );

        expect(annualRenewalDate).toEqual(expectedAnnualRenewalDate);
      }
    );

    it('should return an error if cancel date is before start date', () => {
      const result = calculateRemainingMonthsToAnnualRenewal(
        new Date('2021-01-01'),
        new Date('2020-01-01')
      );

      expect(result).toEqual({
        error: 'Cancellation date cannot be before the start date.',
      });
    });
  });
});
