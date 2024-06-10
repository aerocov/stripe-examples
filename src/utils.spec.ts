import { calculateRemainingMonthsToAnnualRenewal } from './utils';

describe('utils', () => {
  describe('calculateRemainingMonthsToAnnualRenewal()', () => {
    it.each`
      start                     | cancel                    | expectedRemainingMonths | expectedAnnualRenewalDate
      ${new Date('2021-01-01')} | ${new Date('2021-03-01')} | ${10}                   | ${new Date('2022-01-01')}
      ${new Date('2021-01-01')} | ${new Date('2022-01-10')} | ${0}                    | ${new Date('2022-01-01')}
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
  });
});
