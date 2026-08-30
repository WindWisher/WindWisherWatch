# Watch versus WindWisher metric ownership

| Metric                 |     Watch records input | Watch calculates live |    WindWisher calculates post |
| ---------------------- | ----------------------: | --------------------: | ----------------------------: |
| Elapsed time           |                     Yes |                   Yes |                           Yes |
| Current speed          |        GPS ground speed |                   Yes |                      Optional |
| Maximum speed          |        GPS ground speed |                   Yes |                           Yes |
| Distance               |           GPS positions |                   Yes |                           Yes |
| Latest HR              |              HR samples |                   Yes |                      Optional |
| Average speed          |           GPS positions |                    No |                           Yes |
| Speed P95              |           GPS positions |                    No |                           Yes |
| Active/stopped time    |           GPS positions |                    No |                           Yes |
| VMG                    |           GPS positions |                    No |                           Yes |
| Tack/jibe analysis     |           GPS positions |                    No |                           Yes |
| Area covered           |           GPS positions |                    No |                           Yes |
| Historical comparisons |       canonical session |                    No |                           Yes |
| Future jump metrics    | future capability input |                    No | Future specialized capability |

The watch summary is operational and recomputable. It does not replace primary samples or become the source for advanced analytics.
